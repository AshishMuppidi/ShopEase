package com.ashish.ecommerce.auth;

import com.ashish.ecommerce.auth.entity.RefreshToken;
import com.ashish.ecommerce.auth.repository.RefreshTokenRepository;
import com.ashish.ecommerce.auth.service.RefreshTokenService;
import com.ashish.ecommerce.common.exception.TokenRefreshException;
import com.ashish.ecommerce.user.entity.User;
import com.ashish.ecommerce.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    @Test
    void rotateRefreshToken_shouldRevokeOldTokenAndCreateNewToken() {

        User user = User.builder()
                .id(1L)
                .email("ashish@example.com")
                .build();

        RefreshToken oldToken = RefreshToken.builder()
                .id(1L)
                .token("old-token")
                .familyId("family-1")
                .user(user)
                .expiryDate(Instant.now().plusSeconds(3600))
                .build();

        when(refreshTokenRepository.findByTokenForUpdate("old-token"))
                .thenReturn(Optional.of(oldToken));

        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        RefreshToken newToken =
                refreshTokenService.rotateRefreshToken("old-token");

        assertNotNull(newToken);

        assertNotEquals("old-token", newToken.getToken());

        assertEquals("family-1", newToken.getFamilyId());

        assertEquals(user, newToken.getUser());

        assertNotNull(oldToken.getUsedAt());

        assertNotNull(oldToken.getRevokedAt());

        verify(refreshTokenRepository)
                .findByTokenForUpdate("old-token");

        verify(refreshTokenRepository, atLeast(2))
                .save(any(RefreshToken.class));
    }

    @Test
    void rotateRefreshToken_shouldRejectAlreadyConsumedToken() {

        User user = User.builder()
                .id(1L)
                .email("ashish@example.com")
                .build();

        RefreshToken consumedToken = RefreshToken.builder()
                .id(1L)
                .token("old-token")
                .familyId("family-1")
                .user(user)
                .expiryDate(Instant.now().plusSeconds(3600))
                .usedAt(Instant.now())
                .build();

        when(refreshTokenRepository.findByTokenForUpdate("old-token"))
                .thenReturn(Optional.of(consumedToken));

        assertThrows(
                TokenRefreshException.class,
                () -> refreshTokenService.rotateRefreshToken("old-token")
        );

        verify(refreshTokenRepository)
                .revokeFamily(eq("family-1"), any(Instant.class));
    }

    @Test
    void rotateRefreshToken_shouldRejectExpiredToken() {

        User user = User.builder()
                .id(1L)
                .email("ashish@example.com")
                .build();

        RefreshToken expiredToken = RefreshToken.builder()
                .id(1L)
                .token("expired-token")
                .familyId("family-1")
                .user(user)
                .expiryDate(Instant.now().minusSeconds(60))
                .build();

        when(refreshTokenRepository.findByTokenForUpdate("expired-token"))
                .thenReturn(Optional.of(expiredToken));

        assertThrows(
                TokenRefreshException.class,
                () -> refreshTokenService.rotateRefreshToken("expired-token")
        );

        assertNotNull(expiredToken.getRevokedAt());

        verify(refreshTokenRepository)
                .save(expiredToken);
    }

    @Test
    void rotateRefreshToken_shouldRejectUnknownToken() {

        when(refreshTokenRepository.findByTokenForUpdate("does-not-exist"))
                .thenReturn(Optional.empty());

        assertThrows(
                TokenRefreshException.class,
                () -> refreshTokenService.rotateRefreshToken(
                        "does-not-exist"
                )
        );

        verify(refreshTokenRepository, never())
                .save(any());

        verify(refreshTokenRepository, never())
                .revokeFamily(anyString(), any());
    }
}