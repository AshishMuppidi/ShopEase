package com.ashish.ecommerce.review.entity;

import com.ashish.ecommerce.product.entity.Product;
import com.ashish.ecommerce.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity 
@Table(name = "reviews", uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "user_id"}))
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Review {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Min(1) @Max(5)
    @Column(nullable = false)
    private Integer rating;
    
    @Size(max = 200)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String body;
    
    @Column(nullable = false)
    private int helpfulVotes = 0;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }
    
    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }
}
