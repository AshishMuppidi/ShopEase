package com.ashish.ecommerce.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ProductRequest {
    @NotBlank(message = "Product name is required")
    private String name;

    private String description;

    private String brand;

    private String thumbnail;

    private List<String> images;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private boolean active = true;
}
