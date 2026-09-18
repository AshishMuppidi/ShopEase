package com.ashish.ecommerce.order;

import com.ashish.ecommerce.order.entity.OrderStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class OrderStatusTest {

    @Test
    void validTransitionsAreAllowed() {
        assertTrue(OrderStatus.PENDING.canTransitionTo(OrderStatus.CONFIRMED));
        assertTrue(OrderStatus.CONFIRMED.canTransitionTo(OrderStatus.PROCESSING));
        assertTrue(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.PACKED));
        assertTrue(OrderStatus.PACKED.canTransitionTo(OrderStatus.SHIPPED));
        assertTrue(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.DELIVERED));
    }

    @Test
    void invalidTransitionsAreRejected() {
        assertFalse(OrderStatus.DELIVERED.canTransitionTo(OrderStatus.CANCELLED));
        assertFalse(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.PENDING));
        assertFalse(OrderStatus.CANCELLED.canTransitionTo(OrderStatus.PROCESSING));
    }

    @Test
    void cancellationIsOnlyAllowedBeforeShipping() {
        assertTrue(OrderStatus.PENDING.canBeCancelled());
        assertTrue(OrderStatus.CONFIRMED.canBeCancelled());
        assertTrue(OrderStatus.PROCESSING.canBeCancelled());
        assertFalse(OrderStatus.PACKED.canBeCancelled());
        assertFalse(OrderStatus.SHIPPED.canBeCancelled());
    }
}
