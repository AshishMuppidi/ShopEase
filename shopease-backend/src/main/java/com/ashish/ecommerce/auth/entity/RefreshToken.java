package com.ashish.ecommerce.auth.entity;

import com.ashish.ecommerce.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens", indexes = {
        @Index(name = "idx_refresh_token", columnList = "token", unique = true),
        @Index(name = "idx_refresh_family", columnList = "familyId"),
        @Index(name = "idx_refresh_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String token;

    @Column(nullable = false, length = 100)
    private String familyId;

    @Column(nullable = false)
    private Instant expiryDate;

    @Column
    private Instant usedAt;

    @Column
    private Instant revokedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Version
    private Long version;

    public boolean isExpired() {
        return expiryDate.isBefore(Instant.now());
    }

    public boolean isConsumed() {
        return usedAt != null || revokedAt != null;
    }
}
