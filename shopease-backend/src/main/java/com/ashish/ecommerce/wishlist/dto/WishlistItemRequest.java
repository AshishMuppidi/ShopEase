package com.ashish.ecommerce.wishlist.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WishlistItemRequest {
    @NotNull(message = "Variant ID is required")
    private Long variantId;
}
