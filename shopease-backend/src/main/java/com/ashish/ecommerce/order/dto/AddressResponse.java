package com.ashish.ecommerce.order.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Read-only address DTO used in order responses.
 * Separate from AddressRequest to avoid exposing validation annotations
 * and to allow the response shape to evolve independently.
 */
@Data
@Builder
public class AddressResponse {
    private String fullName;
    private String phone;
    private String street;
    private String city;
    private String state;
    private String zipCode;
    private String country;
}
