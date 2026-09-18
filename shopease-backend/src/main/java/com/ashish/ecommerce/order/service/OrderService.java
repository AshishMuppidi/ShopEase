package com.ashish.ecommerce.order.service;

import com.ashish.ecommerce.cart.dto.CartItemResponse;
import com.ashish.ecommerce.cart.dto.CartResponse;
import com.ashish.ecommerce.cart.service.CartService;
import com.ashish.ecommerce.common.exception.BadRequestException;
import com.ashish.ecommerce.common.exception.ConflictException;
import com.ashish.ecommerce.common.exception.InvalidOrderStateException;
import com.ashish.ecommerce.common.exception.ResourceNotFoundException;
import com.ashish.ecommerce.inventory.service.InventoryService;
import com.ashish.ecommerce.order.dto.AddressRequest;
import com.ashish.ecommerce.order.dto.AddressResponse;
import com.ashish.ecommerce.order.dto.CheckoutRequest;
import com.ashish.ecommerce.order.dto.OrderItemResponse;
import com.ashish.ecommerce.order.dto.OrderResponse;
import com.ashish.ecommerce.order.entity.Address;
import com.ashish.ecommerce.order.entity.Order;
import com.ashish.ecommerce.order.entity.OrderItem;
import com.ashish.ecommerce.order.entity.OrderStatus;
import com.ashish.ecommerce.order.repository.OrderRepository;
import com.ashish.ecommerce.product.entity.ProductVariant;
import com.ashish.ecommerce.product.service.ProductVariantService;
import com.ashish.ecommerce.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final InventoryService inventoryService;
    private final ProductVariantService variantService;
    private final com.ashish.ecommerce.profile.repository.UserAddressRepository addressRepository;

    @Transactional
    public OrderResponse checkout(User user, CheckoutRequest request) {
        CartResponse cart = cartService.getCartResponse(user);

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        Address shippingAddress;
        
        if (request.getSavedAddressId() != null) {
            com.ashish.ecommerce.profile.entity.UserAddress savedAddr = addressRepository.findByIdAndUserId(request.getSavedAddressId(), user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Saved address not found"));
            shippingAddress = Address.builder()
                    .fullName(user.getName())
                    .phone(savedAddr.getPhone())
                    .street(savedAddr.getStreet())
                    .city(savedAddr.getCity())
                    .state(savedAddr.getState())
                    .zipCode(savedAddr.getPinCode())
                    .country("India") // default or from saved
                    .build();
        } else {
            if (request.getShippingAddress() == null) {
                throw new BadRequestException("Shipping address is required");
            }
            shippingAddress = Address.builder()
                    .fullName(request.getShippingAddress().getFullName())
                    .phone(request.getShippingAddress().getPhone())
                    .street(request.getShippingAddress().getStreet())
                    .city(request.getShippingAddress().getCity())
                    .state(request.getShippingAddress().getState())
                    .zipCode(request.getShippingAddress().getZipCode())
                    .country(request.getShippingAddress().getCountry())
                    .build();
        }

        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .shippingAddress(shippingAddress)
                .totalAmount(BigDecimal.ZERO)
                .build();

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (CartItemResponse cartItem : cart.getItems()) {
            ProductVariant variant = variantService.getVariantEntityById(cartItem.getVariantId());

            if (!variant.isActive() || !variant.getProduct().isActive()) {
                throw new BadRequestException("Product is no longer available: " + variant.getId());
            }

            inventoryService.reduceInventory(variant.getId(), cartItem.getQuantity());

            BigDecimal itemTotal = variant.getPrice()
                    .multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            total = total.add(itemTotal);

            orderItems.add(OrderItem.builder()
                    .order(order)
                    .variant(variant)
                    .quantity(cartItem.getQuantity())
                    .price(variant.getPrice())
                    .build());
        }

        order.setTotalAmount(total);
        order.setItems(orderItems);
        order = orderRepository.save(order);

        cartService.clearCart(user);

        return mapToResponse(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getUserOrders(User user, Pageable pageable) {
        return orderRepository.findByUserId(user.getId(), pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByIdAndUser(Long orderId, User user) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getId().equals(user.getId()) && user.getRole().name().equals("CUSTOMER")) {
            throw new AccessDeniedException("Cannot access another user's order");
        }

        return mapToResponse(order);
    }
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Order not found"));

        return mapToResponse(order);
    }
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus status) {

        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Order not found"));

        boolean validTransition = false;
        switch (order.getStatus()) {
            case PENDING:
                validTransition = (status == OrderStatus.PROCESSING || status == OrderStatus.CANCELLED);
                break;
            case PROCESSING:
                validTransition = (status == OrderStatus.SHIPPED || status == OrderStatus.CANCELLED);
                break;
            case SHIPPED:
                validTransition = (status == OrderStatus.DELIVERED);
                break;
            case DELIVERED:
            case CANCELLED:
                validTransition = false;
                break;
            default:
                validTransition = false;
        }

        if (!validTransition) {
            throw new InvalidOrderStateException(
                    "Invalid order status transition: "
                            + order.getStatus() + " -> " + status);
        }

        order.setStatus(status);

        return mapToResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId, User user) {

        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException(
                    "Cannot cancel another user's order");
        }

        if (!order.getStatus().canBeCancelled()) {
            throw new InvalidOrderStateException(
                    "Order cannot be cancelled from status: "
                            + order.getStatus());
        }

        order.setStatus(OrderStatus.CANCELLED);

        for (OrderItem item : order.getItems()) {
            inventoryService.restoreInventory(
                    item.getVariant().getId(),
                    item.getQuantity()
            );
        }

        return mapToResponse(orderRepository.save(order));
    }

    private OrderResponse mapToResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream().map(item ->
                OrderItemResponse.builder()
                        .id(item.getId())
                        .variantId(item.getVariant().getId())
                        .productName(item.getVariant().getProduct().getName())
                        .sku(item.getVariant().getSku())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .subTotal(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                        .build()
        ).collect(Collectors.toList());

        AddressResponse addressResponse = AddressResponse.builder()
                .fullName(order.getShippingAddress().getFullName())
                .phone(order.getShippingAddress().getPhone())
                .street(order.getShippingAddress().getStreet())
                .city(order.getShippingAddress().getCity())
                .state(order.getShippingAddress().getState())
                .zipCode(order.getShippingAddress().getZipCode())
                .country(order.getShippingAddress().getCountry())
                .build();

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .status(order.getStatus())
                .shippingAddress(addressResponse)
                .totalAmount(order.getTotalAmount())
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
