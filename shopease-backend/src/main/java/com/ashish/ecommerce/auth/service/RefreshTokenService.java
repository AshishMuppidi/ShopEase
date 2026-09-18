package com.ashish.ecommerce.auth.service;

import com.ashish.ecommerce.auth.entity.RefreshToken;
import com.ashish.ecommerce.auth.repository.RefreshTokenRepository;
import com.ashish.ecommerce.common.exception.ResourceNotFoundException;
import com.ashish.ecommerce.common.exception.TokenRefreshException;
import com.ashish.ecommerce.user.entity.User;
import com.ashish.ecommerce.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    @Value("${jwt.refresh.expiration}")
    private long refreshExpiration;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return saveNewToken(user, UUID.randomUUID().toString());
    }

    @Transactional
    public RefreshToken rotateRefreshToken(String rawToken) {
        RefreshToken current = refreshTokenRepository.findByTokenForUpdate(rawToken)
                .orElseThrow(() -> new TokenRefreshException("Refresh token is invalid"));

        Instant now = Instant.now();

        if (current.isConsumed()) {
            // Reuse of a consumed token means the token may have been stolen.
            // Revoke the entire token family so no sibling token remains usable.
            refreshTokenRepository.revokeFamily(current.getFamilyId(), now);
            throw new TokenRefreshException("Refresh token reuse detected");
        }

        if (current.isExpired()) {
            current.setRevokedAt(now);
            refreshTokenRepository.save(current);
            throw new TokenRefreshException("Refresh token was expired. Please sign in again");
        }

        current.setUsedAt(now);
        current.setRevokedAt(now);
        refreshTokenRepository.save(current);

        return saveNewToken(current.getUser(), current.getFamilyId());
    }

    @Transactional
    public int revokeAllForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return refreshTokenRepository.revokeAllByUser(user, Instant.now());
    }

    private RefreshToken saveNewToken(User user, String familyId) {
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .familyId(familyId)
                .expiryDate(Instant.now().plusMillis(refreshExpiration))
                .build();

        return refreshTokenRepository.save(refreshToken);
    }
}
