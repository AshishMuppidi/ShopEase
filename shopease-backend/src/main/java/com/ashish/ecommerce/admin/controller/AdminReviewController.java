package com.ashish.ecommerce.admin.controller;

import com.ashish.ecommerce.review.dto.ReviewResponse;
import com.ashish.ecommerce.review.repository.ReviewRepository;
import com.ashish.ecommerce.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<Page<ReviewResponse>> listAllReviews(Pageable pageable) {
        return ResponseEntity.ok(reviewService.getAllReviews(pageable));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id, null, true); // isAdmin = true
        return ResponseEntity.noContent().build();
    }
}
