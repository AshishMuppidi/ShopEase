package com.ashish.ecommerce.payment.service;

import com.ashish.ecommerce.common.exception.BadRequestException;
import com.ashish.ecommerce.common.exception.ConflictException;
import com.ashish.ecommerce.common.exception.ResourceNotFoundException;
import com.ashish.ecommerce.inventory.service.InventoryService;
import com.ashish.ecommerce.order.entity.Order;
import com.ashish.ecommerce.order.entity.OrderItem;
import com.ashish.ecommerce.order.entity.OrderStatus;
import com.ashish.ecommerce.order.repository.OrderRepository;
import com.ashish.ecommerce.payment.dto.PaymentIntentRequest;
import com.ashish.ecommerce.payment.dto.PaymentIntentResponse;
import com.ashish.ecommerce.payment.dto.WebhookRequest;
import com.ashish.ecommerce.payment.entity.Payment;
import com.ashish.ecommerce.payment.entity.PaymentStatus;
import com.ashish.ecommerce.payment.repository.PaymentRepository;
import com.ashish.ecommerce.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final ObjectMapper objectMapper;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;

    @Transactional
    public PaymentIntentResponse createPaymentIntent(User user, PaymentIntentRequest request) {
        // 1. Check whether this idempotency key was already used
        Optional<Payment> existing = paymentRepository.findByIdempotencyKey(request.getIdempotencyKey());
        if (existing.isPresent()) {
            Payment payment = existing.get();

            // Reusing idempotency key for another order must be rejected
            if (!payment.getOrder().getId().equals(request.getOrderId())) {
                throw new ConflictException("Idempotency key was already used for another order");
            }

            // User must not access another user's payment
            if (!payment.getOrder().getUser().getId().equals(user.getId())) {
                throw new AccessDeniedException("Cannot access another user's payment");
            }

            return mapToIntentResponse(payment);
        }

        // 2. Fetch and validate order
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Cannot access another user's order");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ConflictException("Order is not in a valid state for payment: " + order.getStatus());
        }

        // 3. Check existing payment for this order
        Optional<Payment> existingPayment = paymentRepository.findByOrderId(order.getId());
        if (existingPayment.isPresent()) {
            Payment payment = existingPayment.get();

            if (payment.getStatus() == PaymentStatus.COMPLETED) {
                throw new ConflictException("Order has already been paid");
            }

            if (payment.getStatus() == PaymentStatus.PENDING) {
                return mapToIntentResponse(payment);
            }

            // Allow retry on failed payment
            payment.setStatus(PaymentStatus.PENDING);
            payment.setIdempotencyKey(request.getIdempotencyKey());
            payment.setTransactionId("txn_" + UUID.randomUUID().toString().substring(0, 8));
            payment.setAmount(order.getTotalAmount());
            return mapToIntentResponse(paymentRepository.save(payment));
        }

        // 4. Create new payment with separate transactionId and idempotencyKey
        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .status(PaymentStatus.PENDING)
                .idempotencyKey(request.getIdempotencyKey())
                .transactionId("txn_" + UUID.randomUUID().toString().substring(0, 8))
                .build();

        payment = paymentRepository.save(payment);
        return mapToIntentResponse(payment);
    }

    @Transactional
    public void processWebhook(String rawPayload) {
        WebhookRequest request = parseAndValidatePayload(rawPayload);
        log.info("Received webhook for transaction: {}", request.getTransactionId());

        Payment payment = paymentRepository.findByIdempotencyKey(request.getIdempotencyKey())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (!payment.getTransactionId().equals(request.getTransactionId())) {
            throw new BadRequestException("Transaction does not match payment");
        }

        if (payment.getAmount().compareTo(request.getAmount()) != 0) {
            throw new BadRequestException("Payment amount does not match order amount");
        }

        PaymentStatus targetStatus;
        if ("payment_intent.succeeded".equalsIgnoreCase(request.getEventType())) {
            targetStatus = PaymentStatus.COMPLETED;
        } else if ("payment_intent.failed".equalsIgnoreCase(request.getEventType())) {
            targetStatus = PaymentStatus.FAILED;
        } else {
            throw new BadRequestException("Unsupported payment event type");
        }

        // Duplicate webhook: already at target status
        if (payment.getStatus() == targetStatus) {
            log.info("Duplicate webhook ignored for transaction: {}", request.getTransactionId());
            return;
        }

        // Invalid transition if not currently pending
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new ConflictException("Invalid payment state transition: " + payment.getStatus() + " -> " + targetStatus);
        }

        // Atomic status update
        int updated = paymentRepository.updateStatusIfCurrent(payment.getId(), PaymentStatus.PENDING, targetStatus);
        if (updated == 0) {
            log.info("Concurrent duplicate webhook ignored for transaction: {}", request.getTransactionId());
            return;
        }

        payment.setStatus(targetStatus);
        Order order = payment.getOrder();

        if (targetStatus == PaymentStatus.COMPLETED) {
            if (order.getStatus() != OrderStatus.PENDING) {
                throw new ConflictException("Order is not in a valid state for payment completion: " + order.getStatus());
            }
            order.setStatus(OrderStatus.PROCESSING);
        } else {
            if (order.getStatus() != OrderStatus.PENDING) {
                throw new ConflictException("Order is not in a valid state for payment failure: " + order.getStatus());
            }
            order.setStatus(OrderStatus.FAILED);
            restoreInventory(order);
        }

        orderRepository.save(order);
    }

    @Transactional
    public PaymentIntentResponse confirmPayment(User user, Long orderId, String outcome) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("No payment intent found for this order. Create a payment intent first."));

        Order order = payment.getOrder();
        if (!order.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Cannot access another user's order");
        }

        boolean failure = outcome != null && (
                "FAILURE".equalsIgnoreCase(outcome)
                        || "FAIL".equalsIgnoreCase(outcome)
                        || "FAILED".equalsIgnoreCase(outcome)
                        || "payment_intent.failed".equalsIgnoreCase(outcome)
        );

        boolean success = outcome == null
                || outcome.isBlank()
                || "SUCCESS".equalsIgnoreCase(outcome)
                || "SUCCEEDED".equalsIgnoreCase(outcome)
                || "payment_intent.succeeded".equalsIgnoreCase(outcome);

        if (!failure && !success) {
            throw new BadRequestException("Unsupported payment outcome: " + outcome);
        }

        PaymentStatus targetStatus = failure ? PaymentStatus.FAILED : PaymentStatus.COMPLETED;

        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            throw new ConflictException("Order has already been paid");
        }

        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new ConflictException("Payment is not in a valid state to confirm: " + payment.getStatus());
        }

        int updated = paymentRepository.updateStatusIfCurrent(payment.getId(), PaymentStatus.PENDING, targetStatus);
        if (updated == 0) {
            throw new ConflictException("Payment was already processed by another request");
        }

        payment.setStatus(targetStatus);

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ConflictException("Order is not in a valid state for payment confirmation: " + order.getStatus());
        }

        if (targetStatus == PaymentStatus.COMPLETED) {
            order.setStatus(OrderStatus.PROCESSING);
        } else {
            order.setStatus(OrderStatus.FAILED);
            restoreInventory(order);
        }

        orderRepository.save(order);
        return mapToIntentResponse(payment);
    }

    private WebhookRequest parseAndValidatePayload(String rawPayload) {
        try {
            WebhookRequest request = objectMapper.readValue(rawPayload, WebhookRequest.class);

            if (request.getEventType() == null || request.getEventType().isBlank()
                    || request.getTransactionId() == null || request.getTransactionId().isBlank()
                    || request.getIdempotencyKey() == null || request.getIdempotencyKey().isBlank()
                    || request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Invalid webhook payload");
            }

            return request;
        } catch (JacksonException e) {
            throw new BadRequestException("Invalid webhook payload");
        }
    }

    private void restoreInventory(Order order) {
        for (OrderItem item : order.getItems()) {
            inventoryService.restoreInventory(item.getVariant().getId(), item.getQuantity());
        }
    }

    private PaymentIntentResponse mapToIntentResponse(Payment payment) {
        return PaymentIntentResponse.builder()
                .clientSecret("secret_" + payment.getTransactionId())
                .transactionId(payment.getTransactionId())
                .idempotencyKey(payment.getIdempotencyKey())
                .status(payment.getStatus().name())
                .build();
    }
}