package com.ashish.ecommerce.product.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ProductVariantResponse {
    private Long id;
    private Long productId;
    private String sku;
    private String attributes;
    private BigDecimal price;
    private boolean active;
    private Integer availableQuantity;
    private BigDecimal originalPrice;
    private BigDecimal discountPercent;
}
