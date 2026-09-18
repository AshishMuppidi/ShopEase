package com.ashish.ecommerce.profile.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProfileUpdateRequest {
    @NotBlank(message = "Name is required")
    private String name;
    
    private String phone;
}
