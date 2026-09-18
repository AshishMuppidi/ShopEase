package com.ashish.ecommerce.review.controller;

import com.ashish.ecommerce.review.dto.ReviewRequest;
import com.ashish.ecommerce.review.dto.ReviewResponse;
import com.ashish.ecommerce.review.dto.ReviewSummaryResponse;
import com.ashish.ecommerce.review.service.ReviewService;
import com.ashish.ecommerce.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final com.ashish.ecommerce.user.repository.UserRepository userRepository;

    private Long getCurrentUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        try {
            User user = userRepository.findByEmail(authentication.getName()).orElse(null);
            return user != null ? user.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new com.ashish.ecommerce.common.exception.ResourceNotFoundException("User not found"));
    }

    @GetMapping("/products/{productId}/reviews")
    public ResponseEntity<Page<ReviewResponse>> getReviews(
            @PathVariable Long productId,
            Pageable pageable,
            Authentication authentication) {
        Long currentUserId = getCurrentUserId(authentication);
        return ResponseEntity.ok(reviewService.getReviews(productId, pageable, currentUserId));
    }

    @GetMapping("/products/{productId}/reviews/summary")
    public ResponseEntity<ReviewSummaryResponse> getReviewSummary(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getReviewSummary(productId));
    }

    @PostMapping("/products/{productId}/reviews")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable Long productId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {
        User user = getCurrentUser(authentication);
        ReviewResponse response = reviewService.createReview(productId, request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/reviews/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long id,
            Authentication authentication) {
        User user = getCurrentUser(authentication);
        boolean isAdmin = user.getRole().name().equals("ADMIN");
        reviewService.deleteReview(id, user.getId(), isAdmin);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reviews/{id}/helpful")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> toggleHelpful(
            @PathVariable Long id,
            Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(reviewService.toggleHelpfulVote(id, user.getId()));
    }
}
