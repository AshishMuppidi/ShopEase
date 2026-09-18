package com.ashish.ecommerce.common.exception;

public class InvalidOrderStateException extends ConflictException {
    public InvalidOrderStateException(String message) {
        super(message);
    }
}
