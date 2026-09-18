package com.ashish.ecommerce.user.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserMeResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String role;
}
