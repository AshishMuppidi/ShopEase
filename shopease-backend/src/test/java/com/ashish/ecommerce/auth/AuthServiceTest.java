package com.ashish.ecommerce.auth;

import com.ashish.ecommerce.auth.dto.*;
import com.ashish.ecommerce.auth.entity.RefreshToken;
import com.ashish.ecommerce.auth.repository.RefreshTokenRepository;
import com.ashish.ecommerce.auth.service.AuthService;
import com.ashish.ecommerce.auth.service.JwtService;
import com.ashish.ecommerce.auth.service.RefreshTokenService;
import com.ashish.ecommerce.common.exception.DuplicateResourceException;
import com.ashish.ecommerce.common.exception.TokenRefreshException;
import com.ashish.ecommerce.user.entity.Role;
import com.ashish.ecommerce.user.entity.User;
import com.ashish.ecommerce.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("John Doe")
                .email("john@example.com")
                .password("encodedPassword")
                .role(Role.CUSTOMER)
                .build();

        registerRequest = new RegisterRequest();
        registerRequest.setName("John Doe");
        registerRequest.setEmail("john@example.com");
        registerRequest.setPassword("password123");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("john@example.com");
        loginRequest.setPassword("password123");
    }

    @Test
    @DisplayName("Successful registration saves user with hashed password and CUSTOMER role")
    void register_successful() {
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserResponse response = authService.register(registerRequest);

        assertNotNull(response);
        assertEquals("john@example.com", response.getEmail());
        assertEquals("John Doe", response.getName());
        assertEquals(Role.CUSTOMER, response.getRole());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Registration with existing email throws DuplicateResourceException")
    void register_duplicateEmail_throwsException() {
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(registerRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Successful login returns JWT access token and refresh token")
    void login_successful() {
        Authentication authentication = mock(Authentication.class);
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("john@example.com");
        when(authentication.getPrincipal()).thenReturn(userDetails);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(testUser));
        when(jwtService.generateToken("john@example.com", "CUSTOMER")).thenReturn("mock-access-token");

        RefreshToken refreshToken = RefreshToken.builder()
                .id(1L)
                .token("mock-refresh-token")
                .user(testUser)
                .expiryDate(Instant.now().plusSeconds(604800))
                .build();
        when(refreshTokenService.createRefreshToken(1L)).thenReturn(refreshToken);

        LoginResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        assertEquals("mock-refresh-token", response.getRefreshToken());
        assertEquals("Bearer", response.getTokenType());
    }

    @Test
    @DisplayName("Invalid credentials during login throw BadCredentialsException")
    void login_invalidCredentials_throwsException() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid email or password"));

        assertThrows(BadCredentialsException.class, () -> authService.login(loginRequest));
        verify(jwtService, never()).generateToken(any(), any());
    }

    @Test
    @DisplayName("Refresh token success rotates token and returns new access token")
    void refreshToken_successful() {
        RefreshToken oldToken = RefreshToken.builder()
                .id(1L)
                .token("old-refresh-token")
                .user(testUser)
                .expiryDate(Instant.now().plusSeconds(3600))
                .build();

        RefreshToken newToken = RefreshToken.builder()
                .id(2L)
                .token("new-refresh-token")
                .user(testUser)
                .expiryDate(Instant.now().plusSeconds(604800))
                .build();

        TokenRefreshRequest request = new TokenRefreshRequest();
        request.setRefreshToken("old-refresh-token");

        when(refreshTokenRepository.findByTokenForUpdate("old-refresh-token")).thenReturn(Optional.of(oldToken));
        when(refreshTokenService.createRefreshToken(1L)).thenReturn(newToken);
        when(jwtService.generateToken("john@example.com", "CUSTOMER")).thenReturn("new-access-token");

        TokenRefreshResponse response = authService.refreshToken(request);

        assertNotNull(response);
        assertEquals("new-access-token", response.getAccessToken());
        assertEquals("new-refresh-token", response.getRefreshToken());
        verify(refreshTokenRepository).delete(oldToken);
    }

    @Test
    @DisplayName("Expired refresh token is deleted and throws TokenRefreshException")
    void refreshToken_expired_throwsException() {
        RefreshToken expiredToken = RefreshToken.builder()
                .id(1L)
                .token("expired-token")
                .user(testUser)
                .expiryDate(Instant.now().minusSeconds(3600))
                .build();

        TokenRefreshRequest request = new TokenRefreshRequest();
        request.setRefreshToken("expired-token");

        when(refreshTokenRepository.findByTokenForUpdate("expired-token")).thenReturn(Optional.of(expiredToken));

        assertThrows(TokenRefreshException.class, () -> authService.refreshToken(request));
        verify(refreshTokenRepository).delete(expiredToken);
        verify(refreshTokenService, never()).createRefreshToken(any());
    }
}
