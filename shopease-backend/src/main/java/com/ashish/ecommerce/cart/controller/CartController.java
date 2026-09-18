package com.ashish.ecommerce.cart.controller;

import com.ashish.ecommerce.auth.service.AuthService;
import com.ashish.ecommerce.cart.dto.CartItemRequest;
import com.ashish.ecommerce.cart.dto.CartResponse;
import com.ashish.ecommerce.cart.service.CartService;
import com.ashish.ecommerce.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<CartResponse> getCart(@AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(cartService.getCartResponse(user));
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> addItem(@AuthenticationPrincipal UserDetails userDetails,
                                                @Valid @RequestBody CartItemRequest request) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(cartService.addItem(user, request));
    }

    @PutMapping("/items/{variantId}")
    public ResponseEntity<CartResponse> updateItemQuantity(@AuthenticationPrincipal UserDetails userDetails,
                                                           @PathVariable Long variantId,
                                                           @RequestParam Integer quantity) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(cartService.updateItemQuantity(user, variantId, quantity));
    }

    @DeleteMapping("/items/{variantId}")
    public ResponseEntity<CartResponse> removeItem(@AuthenticationPrincipal UserDetails userDetails,
                                                   @PathVariable Long variantId) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(cartService.removeItem(user, variantId));
    }

    @DeleteMapping
    public ResponseEntity<CartResponse> clearCart(@AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(cartService.clearCart(user));
    }
}
