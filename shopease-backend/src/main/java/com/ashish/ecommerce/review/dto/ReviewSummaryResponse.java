package com.ashish.ecommerce.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReviewSummaryResponse {
    private Double averageRating;
    private long totalCount;
    private Map<Integer, Long> ratingDistribution;
}
