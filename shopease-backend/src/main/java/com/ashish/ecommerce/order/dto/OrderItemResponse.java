package com.ashish.ecommerce.order.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class OrderItemResponse {
    private Long id;
    private Long variantId;
    private String productName;
    private String sku;
    private Integer quantity;
    private BigDecimal price; // Purchase-time price
    private BigDecimal subTotal;
}
