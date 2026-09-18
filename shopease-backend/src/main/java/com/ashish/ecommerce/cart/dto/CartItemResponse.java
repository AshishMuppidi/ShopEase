package com.ashish.ecommerce.cart.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CartItemResponse {
    private Long id;
    private Long variantId;
    private String productName;
    private String sku;
    private String attributes;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal subTotal;
}
