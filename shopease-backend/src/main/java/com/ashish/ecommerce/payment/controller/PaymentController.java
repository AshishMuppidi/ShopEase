package com.ashish.ecommerce.payment.controller;

import com.ashish.ecommerce.auth.service.AuthService;
import com.ashish.ecommerce.payment.dto.ConfirmPaymentRequest;
import com.ashish.ecommerce.payment.dto.PaymentIntentRequest;
import com.ashish.ecommerce.payment.dto.PaymentIntentResponse;
import com.ashish.ecommerce.payment.service.PaymentService;
import com.ashish.ecommerce.payment.security.WebhookSignatureService;
import com.ashish.ecommerce.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final AuthService authService;
    private final WebhookSignatureService webhookSignatureService;

    @PostMapping("/intent")
    public ResponseEntity<PaymentIntentResponse> createIntent(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PaymentIntentRequest request) {

        User user = authService.getUserByEmail(userDetails.getUsername());

        return ResponseEntity.ok(
                paymentService.createPaymentIntent(user, request)
        );
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestHeader(value = "X-Webhook-Signature", required = false)
            String signature,
            @RequestBody String rawPayload) {

        if (!webhookSignatureService.isValid(rawPayload, signature)) {
            return ResponseEntity.status(401)
                    .body("Invalid webhook signature");
        }

        paymentService.processWebhook(rawPayload);

        return ResponseEntity.ok("Webhook processed successfully");
    }

    /**
     * Simulated payment confirmation for the authenticated order owner.
     *
     * <p>The production path completes a payment via the signed
     * {@code /webhook} endpoint, which a browser cannot call (it lacks the
     * shared HMAC secret). This endpoint lets the frontend drive the simulated
     * result while the backend stays authoritative for the state transition and
     * inventory. Ownership is enforced in the service.</p>
     */
    @PostMapping("/confirm")
    public ResponseEntity<PaymentIntentResponse> confirmPayment(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ConfirmPaymentRequest request) {

        User user = authService.getUserByEmail(userDetails.getUsername());

        return ResponseEntity.ok(
                paymentService.confirmPayment(user, request.getOrderId(), request.getOutcome())
        );
    }
}