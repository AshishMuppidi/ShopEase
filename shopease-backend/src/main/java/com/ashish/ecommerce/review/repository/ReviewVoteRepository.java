package com.ashish.ecommerce.review.repository;

import com.ashish.ecommerce.review.entity.ReviewVote;
import com.ashish.ecommerce.review.entity.ReviewVoteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewVoteRepository extends JpaRepository<ReviewVote, ReviewVoteId> {

    Optional<ReviewVote> findByReviewIdAndUserId(Long reviewId, Long userId);

    boolean existsByReviewIdAndUserId(Long reviewId, Long userId);
}
