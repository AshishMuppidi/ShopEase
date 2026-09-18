package com.ashish.ecommerce.product.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private String brand;
    private String thumbnail;
    private List<String> images;
    private boolean active;
    private Long categoryId;
    private String categoryName;
    private Double averageRating;
    private Long reviewCount;
    private java.math.BigDecimal minPrice;
    private java.math.BigDecimal discountPercent;
}
