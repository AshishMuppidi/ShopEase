package com.ashish.ecommerce.order.entity;

import java.util.EnumSet;
import java.util.Set;

public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PROCESSING,
    PACKED,
    SHIPPED,
    DELIVERED,
    CANCELLED,
    FAILED;

    public boolean canTransitionTo(OrderStatus target) {
        if (target == null || this == target) {
            return this == target;
        }

        return switch (this) {
            case PENDING -> EnumSet.of(CONFIRMED, PROCESSING, CANCELLED, FAILED).contains(target);
            case CONFIRMED -> EnumSet.of(PROCESSING, CANCELLED).contains(target);
            case PROCESSING -> EnumSet.of(PACKED, CANCELLED).contains(target);
            case PACKED -> target == SHIPPED;
            case SHIPPED -> target == DELIVERED;
            case DELIVERED, CANCELLED, FAILED -> false;
        };
    }

    public boolean isTerminal() {
        return this == DELIVERED || this == CANCELLED || this == FAILED;
    }

    public boolean canBeCancelled() {
        return this == PENDING || this == CONFIRMED || this == PROCESSING;
    }
}
