package com.ashish.ecommerce.auth.repository;

import com.ashish.ecommerce.auth.entity.RefreshToken;
import com.ashish.ecommerce.user.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select rt from RefreshToken rt join fetch rt.user where rt.token = :token")
    Optional<RefreshToken> findByTokenForUpdate(@Param("token") String token);

    @Modifying
    @Query("update RefreshToken rt set rt.revokedAt = :now where rt.user = :user and rt.revokedAt is null")
    int revokeAllByUser(@Param("user") User user, @Param("now") Instant now);

    @Modifying
    @Query("update RefreshToken rt set rt.revokedAt = :now where rt.familyId = :familyId and rt.revokedAt is null")
    int revokeFamily(@Param("familyId") String familyId, @Param("now") Instant now);
}
