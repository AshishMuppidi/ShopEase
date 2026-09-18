package com.ashish.ecommerce.payment.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentIntentResponse {
    private String clientSecret;
    private String transactionId;
    private String idempotencyKey;
    private String status;
}
