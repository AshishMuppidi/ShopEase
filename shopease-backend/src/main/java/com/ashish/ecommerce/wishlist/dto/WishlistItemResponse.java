package com.ashish.ecommerce.wishlist.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class WishlistItemResponse {
    private Long id;
    private Long variantId;
    private String productName;
    private String sku;
    private String attributes;
    private BigDecimal price;
    private boolean inStock;
}
