package com.ashish.ecommerce.payment;

import com.ashish.ecommerce.common.exception.BadRequestException;
import com.ashish.ecommerce.common.exception.ConflictException;
import com.ashish.ecommerce.common.exception.ResourceNotFoundException;
import com.ashish.ecommerce.inventory.service.InventoryService;
import com.ashish.ecommerce.order.entity.Order;
import com.ashish.ecommerce.order.entity.OrderStatus;
import com.ashish.ecommerce.order.repository.OrderRepository;
import com.ashish.ecommerce.payment.dto.PaymentIntentRequest;
import com.ashish.ecommerce.payment.dto.PaymentIntentResponse;
import com.ashish.ecommerce.payment.dto.WebhookRequest;
import com.ashish.ecommerce.payment.entity.Payment;
import com.ashish.ecommerce.payment.entity.PaymentStatus;
import com.ashish.ecommerce.payment.repository.PaymentRepository;
import com.ashish.ecommerce.payment.service.PaymentService;
import com.ashish.ecommerce.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private PaymentService paymentService;

    private User testUser;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("user@example.com")
                .build();

        testOrder = Order.builder()
                .id(10L)
                .user(testUser)
                .status(OrderStatus.PENDING)
                .totalAmount(new BigDecimal("250.00"))
                .items(java.util.Collections.emptyList())
                .build();
    }

    @Test
    @DisplayName("createPaymentIntent: creates new payment with unique idempotencyKey and generated transactionId")
    void createPaymentIntent_successfulCreation() {
        PaymentIntentRequest request = new PaymentIntentRequest();
        request.setOrderId(10L);
        request.setIdempotencyKey("idem-key-new");

        when(paymentRepository.findByIdempotencyKey("idem-key-new")).thenReturn(Optional.empty());
        when(orderRepository.findById(10L)).thenReturn(Optional.of(testOrder));
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            p.setId(100L);
            return p;
        });

        PaymentIntentResponse response = paymentService.createPaymentIntent(testUser, request);

        assertNotNull(response);
        assertEquals("idem-key-new", response.getIdempotencyKey());
        assertEquals("PENDING", response.getStatus());
        assertTrue(response.getTransactionId().startsWith("txn_"));
        assertTrue(response.getClientSecret().startsWith("secret_txn_"));
        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    @DisplayName("createPaymentIntent: repeated request with same idempotencyKey returns existing payment without saving new one")
    void sameIdempotencyKey_shouldReturnExistingPayment() {
        String key = "test-key-123";

        Payment existingPayment = Payment.builder()
                .id(1L)
                .order(testOrder)
                .idempotencyKey(key)
                .transactionId("txn_existing_123")
                .amount(new BigDecimal("250.00"))
                .status(PaymentStatus.PENDING)
                .build();

        PaymentIntentRequest request = new PaymentIntentRequest();
        request.setOrderId(10L);
        request.setIdempotencyKey(key);

        when(paymentRepository.findByIdempotencyKey(key)).thenReturn(Optional.of(existingPayment));

        PaymentIntentResponse response = paymentService.createPaymentIntent(testUser, request);

        assertNotNull(response);
        assertEquals("txn_existing_123", response.getTransactionId());
        assertEquals(key, response.getIdempotencyKey());
        assertEquals("PENDING", response.getStatus());
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    @DisplayName("createPaymentIntent: reusing idempotencyKey for different order throws ConflictException")
    void sameIdempotencyKey_differentOrder_shouldThrowConflict() {
        String key = "test-key-123";

        Payment existingPayment = Payment.builder()
                .id(1L)
                .order(testOrder)
                .idempotencyKey(key)
                .transactionId("txn_123")
                .amount(new BigDecimal("250.00"))
                .status(PaymentStatus.PENDING)
                .build();

        PaymentIntentRequest request = new PaymentIntentRequest();
        request.setOrderId(99L); // Different order ID
        request.setIdempotencyKey(key);

        when(paymentRepository.findByIdempotencyKey(key)).thenReturn(Optional.of(existingPayment));

        assertThrows(ConflictException.class, () -> paymentService.createPaymentIntent(testUser, request));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    @DisplayName("createPaymentIntent: rejects attempt to pay for another user's order")
    void createPaymentIntent_shouldRejectAnotherUsersOrder() {
        User anotherUser = User.builder().id(2L).build();

        when(orderRepository.findById(10L)).thenReturn(Optional.of(testOrder));

        PaymentIntentRequest request = new PaymentIntentRequest();
        request.setOrderId(10L);
        request.setIdempotencyKey("key-1");

        assertThrows(AccessDeniedException.class, () -> paymentService.createPaymentIntent(anotherUser, request));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("createPaymentIntent: rejects non-pending orders")
    void createPaymentIntent_shouldRejectNonPendingOrder() {
        testOrder.setStatus(OrderStatus.PROCESSING);
        when(orderRepository.findById(10L)).thenReturn(Optional.of(testOrder));

        PaymentIntentRequest request = new PaymentIntentRequest();
        request.setOrderId(10L);
        request.setIdempotencyKey("key-1");

        assertThrows(ConflictException.class, () -> paymentService.createPaymentIntent(testUser, request));
    }

    @Test
    @DisplayName("processWebhook: successful payment transitions payment to COMPLETED and order to PROCESSING")
    void processWebhook_successfulTransition() throws Exception {
        String rawPayload = "{\"eventType\":\"payment_intent.succeeded\",\"transactionId\":\"txn_123\",\"idempotencyKey\":\"idem_123\",\"amount\":250.00}";

        WebhookRequest webhookRequest = new WebhookRequest();
        webhookRequest.setEventType("payment_intent.succeeded");
        webhookRequest.setTransactionId("txn_123");
        webhookRequest.setIdempotencyKey("idem_123");
        webhookRequest.setAmount(new BigDecimal("250.00"));

        when(objectMapper.readValue(rawPayload, WebhookRequest.class)).thenReturn(webhookRequest);

        Payment payment = Payment.builder()
                .id(1L)
                .order(testOrder)
                .transactionId("txn_123")
                .idempotencyKey("idem_123")
                .amount(new BigDecimal("250.00"))
                .status(PaymentStatus.PENDING)
                .build();

        when(paymentRepository.findByIdempotencyKey("idem_123")).thenReturn(Optional.of(payment));
        when(paymentRepository.updateStatusIfCurrent(1L, PaymentStatus.PENDING, PaymentStatus.COMPLETED)).thenReturn(1);

        paymentService.processWebhook(rawPayload);

        assertEquals(PaymentStatus.COMPLETED, payment.getStatus());
        assertEquals(OrderStatus.PROCESSING, testOrder.getStatus());
        verify(orderRepository).save(testOrder);
    }

    @Test
    @DisplayName("processWebhook: duplicate webhook with status already COMPLETED is ignored idempotently")
    void processWebhook_duplicateWebhookIgnored() throws Exception {
        String rawPayload = "{\"eventType\":\"payment_intent.succeeded\",\"transactionId\":\"txn_123\",\"idempotencyKey\":\"idem_123\",\"amount\":250.00}";

        WebhookRequest webhookRequest = new WebhookRequest();
        webhookRequest.setEventType("payment_intent.succeeded");
        webhookRequest.setTransactionId("txn_123");
        webhookRequest.setIdempotencyKey("idem_123");
        webhookRequest.setAmount(new BigDecimal("250.00"));

        when(objectMapper.readValue(rawPayload, WebhookRequest.class)).thenReturn(webhookRequest);

        Payment payment = Payment.builder()
                .id(1L)
                .order(testOrder)
                .transactionId("txn_123")
                .idempotencyKey("idem_123")
                .amount(new BigDecimal("250.00"))
                .status(PaymentStatus.COMPLETED)
                .build();

        when(paymentRepository.findByIdempotencyKey("idem_123")).thenReturn(Optional.of(payment));

        paymentService.processWebhook(rawPayload);

        verify(paymentRepository, never()).updateStatusIfCurrent(any(), any(), any());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("processWebhook: invalid state transition throws ConflictException")
    void processWebhook_invalidStateTransition_throwsConflict() throws Exception {
        String rawPayload = "{\"eventType\":\"payment_intent.succeeded\",\"transactionId\":\"txn_123\",\"idempotencyKey\":\"idem_123\",\"amount\":250.00}";

        WebhookRequest webhookRequest = new WebhookRequest();
        webhookRequest.setEventType("payment_intent.succeeded");
        webhookRequest.setTransactionId("txn_123");
        webhookRequest.setIdempotencyKey("idem_123");
        webhookRequest.setAmount(new BigDecimal("250.00"));

        when(objectMapper.readValue(rawPayload, WebhookRequest.class)).thenReturn(webhookRequest);

        Payment payment = Payment.builder()
                .id(1L)
                .order(testOrder)
                .transactionId("txn_123")
                .idempotencyKey("idem_123")
                .amount(new BigDecimal("250.00"))
                .status(PaymentStatus.FAILED)
                .build();

        when(paymentRepository.findByIdempotencyKey("idem_123")).thenReturn(Optional.of(payment));

        assertThrows(ConflictException.class, () -> paymentService.processWebhook(rawPayload));
    }

    @Test
    @DisplayName("confirmPayment: successfully confirms pending payment")
    void confirmPayment_successful() {
        Payment payment = Payment.builder()
                .id(1L)
                .order(testOrder)
                .transactionId("txn_abc")
                .idempotencyKey("idem_abc")
                .status(PaymentStatus.PENDING)
                .amount(new BigDecimal("250.00"))
                .build();

        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.of(payment));
        when(paymentRepository.updateStatusIfCurrent(1L, PaymentStatus.PENDING, PaymentStatus.COMPLETED)).thenReturn(1);

        PaymentIntentResponse response = paymentService.confirmPayment(testUser, 10L, "SUCCESS");

        assertNotNull(response);
        assertEquals("COMPLETED", response.getStatus());
        assertEquals(OrderStatus.PROCESSING, testOrder.getStatus());
        verify(orderRepository).save(testOrder);
    }
}