package com.ashish.ecommerce.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentIntentRequest {
    @NotNull(message = "Order ID is required")
    private Long orderId;
    @NotBlank(message = "Idempotency key is required")
    private String idempotencyKey;
}
