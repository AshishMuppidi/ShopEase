package com.ashish.ecommerce.product.repository;

import com.ashish.ecommerce.product.entity.ProductVariant;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    
    @EntityGraph(attributePaths = {"product"})
    List<ProductVariant> findByProductId(Long productId);

    @EntityGraph(attributePaths = {"product"})
    Optional<ProductVariant> findBySku(String sku);

    boolean existsBySku(String sku);

    // Returns [productId, minPrice, maxDiscount] for active variants of the given product IDs
    @org.springframework.data.jpa.repository.Query("SELECT v.product.id, MIN(v.price), MAX(CASE WHEN v.originalPrice IS NOT NULL AND v.originalPrice > 0 AND v.originalPrice > v.price THEN (v.originalPrice - v.price) * 100.0 / v.originalPrice ELSE 0 END) FROM ProductVariant v WHERE v.product.id IN :productIds AND v.active = true GROUP BY v.product.id")
    List<Object[]> findPriceStatsByProductIds(@org.springframework.data.repository.query.Param("productIds") List<Long> productIds);
}
