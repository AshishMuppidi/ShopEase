package com.ashish.ecommerce.review.entity;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data @NoArgsConstructor @AllArgsConstructor
public class ReviewVoteId implements Serializable {
    private Long reviewId;
    private Long userId;
}
