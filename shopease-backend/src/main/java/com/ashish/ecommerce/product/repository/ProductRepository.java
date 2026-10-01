package com.ashish.ecommerce.product.repository;

import com.ashish.ecommerce.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

   @EntityGraph(attributePaths = {"category", "images"})
    Page<Product> findByCategoryIdAndActiveTrue(Long categoryId, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "images"})
    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
              AND (:categoryId IS NULL OR p.category.id = :categoryId)
              AND (:keyword IS NULL OR (LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))))
              AND (:minPrice IS NULL OR EXISTS (SELECT v.id FROM ProductVariant v WHERE v.product = p AND v.active = true AND v.price >= :minPrice))
              AND (:maxPrice IS NULL OR EXISTS (SELECT v.id FROM ProductVariant v WHERE v.product = p AND v.active = true AND v.price <= :maxPrice))
              AND (:minRating IS NULL OR (SELECT COALESCE(AVG(CAST(r.rating AS double)), 0.0) FROM Review r WHERE r.product = p) >= :minRating)
            """)
    Page<Product> findFilteredProducts(
            @Param("categoryId") Long categoryId,
            @Param("keyword") String keyword,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            @Param("minRating") Double minRating,
            Pageable pageable);

    @EntityGraph(attributePaths = {"category", "images"})
    Page<Product> findByActiveTrue(Pageable pageable);

    @EntityGraph(attributePaths = {"category", "images"})
    java.util.List<Product> findByCategoryIdAndIdNotOrderByIdDesc(Long categoryId, Long excludeId, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "images"})
    @Query("SELECT DISTINCT v.product FROM ProductVariant v WHERE v.originalPrice IS NOT NULL AND v.originalPrice > 0 AND v.originalPrice > v.price AND v.product.active = true")
    Page<Product> findDeals(Pageable pageable);

    long countByActiveTrue();
}
