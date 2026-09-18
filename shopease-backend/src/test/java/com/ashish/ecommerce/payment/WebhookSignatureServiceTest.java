package com.ashish.ecommerce.payment;

import com.ashish.ecommerce.payment.security.WebhookSignatureService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class WebhookSignatureServiceTest {

    private final WebhookSignatureService service =
            new WebhookSignatureService("test-secret");

    @Test
    void validSignatureIsAccepted() {
        String payload = "{\"eventType\":\"payment_intent.succeeded\"}";
        String signature = service.generateSignature(payload);

        assertTrue(service.isValid(payload, signature));
    }

    @Test
    void modifiedPayloadIsRejected() {
        String payload = "{\"eventType\":\"payment_intent.succeeded\"}";
        String signature = service.generateSignature(payload);

        assertFalse(service.isValid(
                "{\"eventType\":\"payment_intent.failed\"}",
                signature
        ));
    }

    @Test
    void missingSignatureIsRejected() {
        assertFalse(service.isValid("payload", null));
        assertFalse(service.isValid("payload", ""));
    }
}
