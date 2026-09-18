package com.ashish.ecommerce.review.service;

import com.ashish.ecommerce.common.exception.BadRequestException;
import com.ashish.ecommerce.common.exception.ConflictException;
import com.ashish.ecommerce.common.exception.ResourceNotFoundException;
import com.ashish.ecommerce.product.entity.Product;
import com.ashish.ecommerce.product.repository.ProductRepository;
import com.ashish.ecommerce.review.dto.ReviewRequest;
import com.ashish.ecommerce.review.dto.ReviewResponse;
import com.ashish.ecommerce.review.dto.ReviewSummaryResponse;
import com.ashish.ecommerce.review.entity.Review;
import com.ashish.ecommerce.review.entity.ReviewVote;
import com.ashish.ecommerce.review.entity.ReviewVoteId;
import com.ashish.ecommerce.review.repository.ReviewRepository;
import com.ashish.ecommerce.review.repository.ReviewVoteRepository;
import com.ashish.ecommerce.user.entity.User;
import com.ashish.ecommerce.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewVoteRepository reviewVoteRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviews(Long productId, Pageable pageable, Long currentUserId) {
        return reviewRepository.findByProductId(productId, pageable).map(review -> {
            boolean votedHelpful = false;
            if (currentUserId != null) {
                votedHelpful = reviewVoteRepository.existsByReviewIdAndUserId(review.getId(), currentUserId);
            }
            return mapToResponse(review, votedHelpful);
        });
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getAllReviews(Pageable pageable) {
        return reviewRepository.findAll(pageable).map(review -> mapToResponse(review, false));
    }

    @Transactional(readOnly = true)
    public ReviewSummaryResponse getReviewSummary(Long productId) {
        Double avg = reviewRepository.findAverageRatingByProductId(productId);
        long count = reviewRepository.countByProductId(productId);
        
        List<Object[]> distribution = reviewRepository.getRatingDistribution(productId);
        Map<Integer, Long> distMap = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            distMap.put(i, 0L);
        }
        for (Object[] row : distribution) {
            Integer rating = (Integer) row[0];
            Long countRating = (Long) row[1];
            distMap.put(rating, countRating);
        }

        return ReviewSummaryResponse.builder()
                .averageRating(avg == null ? 0.0 : avg)
                .totalCount(count)
                .ratingDistribution(distMap)
                .build();
    }

    @Transactional
    public ReviewResponse createReview(Long productId, ReviewRequest req, Long userId) {
        Optional<Review> existing = reviewRepository.findByProductIdAndUserId(productId, userId);
        if (existing.isPresent()) {
            throw new ConflictException("You have already reviewed this product");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Review review = Review.builder()
                .product(product)
                .user(user)
                .rating(req.getRating())
                .title(req.getTitle())
                .body(req.getBody())
                .helpfulVotes(0)
                .build();

        review = reviewRepository.save(review);
        return mapToResponse(review, false);
    }

    @Transactional
    public void deleteReview(Long reviewId, Long userId, boolean isAdmin) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (!review.getUser().getId().equals(userId) && !isAdmin) {
            throw new BadRequestException("You do not have permission to delete this review");
        }

        reviewRepository.delete(review);
    }

    @Transactional
    public ReviewResponse toggleHelpfulVote(Long reviewId, Long userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Optional<ReviewVote> existingVote = reviewVoteRepository.findByReviewIdAndUserId(reviewId, userId);
        boolean votedHelpful;

        if (existingVote.isPresent()) {
            reviewVoteRepository.delete(existingVote.get());
            review.setHelpfulVotes(review.getHelpfulVotes() - 1);
            votedHelpful = false;
        } else {
            ReviewVote vote = ReviewVote.builder()
                    .id(new ReviewVoteId(reviewId, userId))
                    .review(review)
                    .user(user)
                    .build();
            reviewVoteRepository.save(vote);
            review.setHelpfulVotes(review.getHelpfulVotes() + 1);
            votedHelpful = true;
        }

        review = reviewRepository.save(review);
        return mapToResponse(review, votedHelpful);
    }

    private ReviewResponse mapToResponse(Review review, boolean votedHelpful) {
        return ReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .userName(review.getUser().getName())
                .rating(review.getRating())
                .title(review.getTitle())
                .body(review.getBody())
                .helpfulVotes(review.getHelpfulVotes())
                .votedHelpful(votedHelpful)
                .createdAt(review.getCreatedAt())
                .build();
    }
}
