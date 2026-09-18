package com.ashish.ecommerce.auth.controller;

import com.ashish.ecommerce.auth.dto.LoginRequest;
import com.ashish.ecommerce.auth.dto.LoginResponse;
import com.ashish.ecommerce.auth.dto.RegisterRequest;
import com.ashish.ecommerce.auth.dto.UserResponse;
import com.ashish.ecommerce.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;


    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        UserResponse response = authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok(
                authService.login(request)
        );
    }

    @PostMapping("/refresh")
    public ResponseEntity<com.ashish.ecommerce.auth.dto.TokenRefreshResponse> refreshToken(@Valid @RequestBody com.ashish.ecommerce.auth.dto.TokenRefreshRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        if (userDetails != null) {
            com.ashish.ecommerce.user.entity.User user = authService.getUserByEmail(userDetails.getUsername());
            authService.logout(user.getId());
        }
        return ResponseEntity.ok("Log out successful");
    }
}