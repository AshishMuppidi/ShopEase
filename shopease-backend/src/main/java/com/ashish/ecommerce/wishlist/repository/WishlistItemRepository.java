package com.ashish.ecommerce.wishlist.repository;

import com.ashish.ecommerce.wishlist.entity.WishlistItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    
    @EntityGraph(attributePaths = {"variant", "variant.product"})
    List<WishlistItem> findByWishlistId(Long wishlistId);

    Optional<WishlistItem> findByWishlistIdAndVariantId(Long wishlistId, Long variantId);
}
