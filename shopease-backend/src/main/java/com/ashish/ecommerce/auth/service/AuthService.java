package com.ashish.ecommerce.auth.service;

import com.ashish.ecommerce.auth.dto.*;
import com.ashish.ecommerce.auth.entity.RefreshToken;
import com.ashish.ecommerce.common.exception.DuplicateResourceException;
import com.ashish.ecommerce.common.exception.ResourceNotFoundException;
import com.ashish.ecommerce.user.entity.Role;
import com.ashish.ecommerce.user.entity.User;
import com.ashish.ecommerce.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final com.ashish.ecommerce.auth.repository.RefreshTokenRepository refreshTokenRepository;

    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .build();

        User savedUser = userRepository.save(user);

        return UserResponse.builder()
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .build();
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String accessToken = jwtService.generateToken(user.getEmail(), user.getRole().name());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .build();
    }

    @Transactional
    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        RefreshToken oldToken = refreshTokenRepository.findByTokenForUpdate(request.getRefreshToken())
                .orElseThrow(() -> new com.ashish.ecommerce.common.exception.TokenRefreshException("Refresh token is invalid"));

        if (oldToken.isExpired()) {
            refreshTokenRepository.delete(oldToken);
            throw new com.ashish.ecommerce.common.exception.TokenRefreshException("Refresh token was expired. Please sign in again");
        }

        User user = oldToken.getUser();
        refreshTokenRepository.delete(oldToken);

        RefreshToken newToken = refreshTokenService.createRefreshToken(user.getId());
        String accessToken = jwtService.generateToken(user.getEmail(), user.getRole().name());

        return TokenRefreshResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newToken.getToken())
                .build();
    }

    public void logout(Long userId) {
        refreshTokenService.revokeAllForUser(userId);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
