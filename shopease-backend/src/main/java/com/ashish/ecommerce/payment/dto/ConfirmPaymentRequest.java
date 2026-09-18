package com.ashish.ecommerce.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for the simulated payment-confirmation endpoint
 * ({@code POST /api/payments/confirm}).
 *
 * <p>This exists so a browser client can drive the <em>simulated</em> payment
 * result without the shared webhook HMAC secret. The real gateway integration
 * would still resolve payments via the signed webhook.</p>
 */
@Data
public class ConfirmPaymentRequest {

    @NotNull(message = "Order ID is required")
    private Long orderId;

    /**
     * Desired simulated outcome. Accepts (case-insensitive):
     * {@code "SUCCESS"}/{@code "SUCCEEDED"} (the default when null/blank) or
     * {@code "FAILURE"}/{@code "FAILED"}.
     */
    private String outcome;
}
