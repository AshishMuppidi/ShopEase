package com.ashish.ecommerce.auth.dto;

import com.ashish.ecommerce.user.entity.Role;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private Role role;
}