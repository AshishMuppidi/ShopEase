package com.ashish.ecommerce.order.controller;

import com.ashish.ecommerce.auth.service.AuthService;
import com.ashish.ecommerce.order.dto.CheckoutRequest;
import com.ashish.ecommerce.order.dto.OrderResponse;
import com.ashish.ecommerce.order.entity.OrderStatus;
import com.ashish.ecommerce.order.service.OrderService;
import com.ashish.ecommerce.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final AuthService authService;

    @PostMapping("/api/orders/checkout")
    public ResponseEntity<OrderResponse> checkout(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CheckoutRequest request) {

        User user = authService.getUserByEmail(userDetails.getUsername());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(orderService.checkout(user, request));
    }

    @GetMapping("/api/orders")
    public ResponseEntity<Page<OrderResponse>> getMyOrders(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        User user = authService.getUserByEmail(userDetails.getUsername());

        return ResponseEntity.ok(
                orderService.getUserOrders(
                        user,
                        PageRequest.of(
                                page,
                                size,
                                Sort.by("createdAt").descending()
                        )
                )
        );
    }

    @GetMapping("/api/orders/{id}")
    public ResponseEntity<OrderResponse> getOrderDetails(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {

        User user = authService.getUserByEmail(userDetails.getUsername());

        return ResponseEntity.ok(
                orderService.getOrderByIdAndUser(id, user)
        );
    }

    @PostMapping("/api/orders/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {

        User user = authService.getUserByEmail(userDetails.getUsername());

        return ResponseEntity.ok(
                orderService.cancelOrder(id, user)
        );
    }
    @GetMapping("/api/admin/orders")
    public ResponseEntity<Page<OrderResponse>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(
                orderService.getAllOrders(
                        PageRequest.of(
                                page,
                                size,
                                Sort.by("createdAt").descending()
                        )
                )
        );
    }

    @GetMapping("/api/admin/orders/{id}")
    public ResponseEntity<OrderResponse> getAdminOrderDetails(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                orderService.getOrderById(id)
        );
    }

    @PutMapping("/api/admin/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {

        return ResponseEntity.ok(
                orderService.updateOrderStatus(id, status)
        );
    }
}