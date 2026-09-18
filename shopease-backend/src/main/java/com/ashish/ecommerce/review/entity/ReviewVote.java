package com.ashish.ecommerce.review.entity;

import com.ashish.ecommerce.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity 
@Table(name = "review_votes")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReviewVote {
    @EmbeddedId
    private ReviewVoteId id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("reviewId")
    @JoinColumn(name = "review_id")
    private Review review;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;
}
