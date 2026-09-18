package com.ashish.ecommerce.review.repository;

import com.ashish.ecommerce.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    @EntityGraph(attributePaths = {"user"})
    Page<Review> findByProductId(Long productId, Pageable pageable);

    Optional<Review> findByProductIdAndUserId(Long productId, Long userId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double findAverageRatingByProductId(@Param("productId") Long productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId")
    long countByProductId(@Param("productId") Long productId);

    @Query("SELECT r.rating as rating, COUNT(r) as count FROM Review r WHERE r.product.id = :productId GROUP BY r.rating")
    List<Object[]> getRatingDistribution(@Param("productId") Long productId);

    @Query("SELECT r.product.id as productId, AVG(r.rating) as avgRating, COUNT(r) as reviewCount FROM Review r WHERE r.product.id IN :productIds GROUP BY r.product.id")
    List<Object[]> findRatingStatsByProductIds(@Param("productIds") List<Long> productIds);

    @EntityGraph(attributePaths = {"user", "product"})
    Page<Review> findAll(Pageable pageable);
}
