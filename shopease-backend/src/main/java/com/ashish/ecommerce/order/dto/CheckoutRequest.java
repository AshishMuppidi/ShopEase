package com.ashish.ecommerce.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckoutRequest {
    private Long savedAddressId;

    @Valid
    private AddressRequest shippingAddress;
}
