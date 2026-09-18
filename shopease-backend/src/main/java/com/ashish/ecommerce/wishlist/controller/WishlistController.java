package com.ashish.ecommerce.wishlist.controller;

import com.ashish.ecommerce.auth.service.AuthService;
import com.ashish.ecommerce.user.entity.User;
import com.ashish.ecommerce.wishlist.dto.WishlistItemRequest;
import com.ashish.ecommerce.wishlist.dto.WishlistResponse;
import com.ashish.ecommerce.wishlist.service.WishlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<WishlistResponse> getWishlist(@AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(wishlistService.getWishlistResponse(user));
    }

    @PostMapping("/items")
    public ResponseEntity<WishlistResponse> addItem(@AuthenticationPrincipal UserDetails userDetails,
                                                    @Valid @RequestBody WishlistItemRequest request) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(wishlistService.addItem(user, request));
    }

    @DeleteMapping("/items/{variantId}")
    public ResponseEntity<WishlistResponse> removeItem(@AuthenticationPrincipal UserDetails userDetails,
                                                       @PathVariable Long variantId) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(wishlistService.removeItem(user, variantId));
    }
}
