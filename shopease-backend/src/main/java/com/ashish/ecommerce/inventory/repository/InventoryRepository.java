package com.ashish.ecommerce.inventory.repository;

import com.ashish.ecommerce.inventory.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByVariantId(Long variantId);

    List<Inventory> findByVariantIdIn(List<Long> variantIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT i
            FROM Inventory i
            WHERE i.variant.id = :variantId
            """)
    Optional<Inventory> findByVariantIdForUpdate(
            @Param("variantId") Long variantId
    );

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.availableQuantity < :threshold")
    long countLowStock(@Param("threshold") int threshold);
}