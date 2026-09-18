package com.ashish.ecommerce.wishlist.service;

import com.ashish.ecommerce.common.exception.DuplicateResourceException;
import com.ashish.ecommerce.common.exception.ResourceNotFoundException;
import com.ashish.ecommerce.inventory.service.InventoryService;
import com.ashish.ecommerce.product.entity.ProductVariant;
import com.ashish.ecommerce.product.service.ProductVariantService;
import com.ashish.ecommerce.user.entity.User;
import com.ashish.ecommerce.wishlist.dto.WishlistItemRequest;
import com.ashish.ecommerce.wishlist.dto.WishlistItemResponse;
import com.ashish.ecommerce.wishlist.dto.WishlistResponse;
import com.ashish.ecommerce.wishlist.entity.Wishlist;
import com.ashish.ecommerce.wishlist.entity.WishlistItem;
import com.ashish.ecommerce.wishlist.repository.WishlistItemRepository;
import com.ashish.ecommerce.wishlist.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductVariantService variantService;
    private final InventoryService inventoryService;

    @Transactional
    public WishlistResponse getWishlistResponse(User user) {
        Wishlist wishlist = getOrCreateWishlist(user);
        return mapToResponse(wishlist);
    }

    @Transactional
    public WishlistResponse addItem(User user, WishlistItemRequest request) {
        Wishlist wishlist = getOrCreateWishlist(user);
        ProductVariant variant = variantService.getVariantEntityById(request.getVariantId());

        if (!variant.isActive()) {
            throw new IllegalArgumentException("Product variant is not active");
        }

        if (wishlistItemRepository.findByWishlistIdAndVariantId(wishlist.getId(), variant.getId()).isPresent()) {
            throw new DuplicateResourceException("Item already in wishlist");
        }

        WishlistItem item = WishlistItem.builder()
                .wishlist(wishlist)
                .variant(variant)
                .build();
        wishlistItemRepository.save(item);

        return mapToResponse(wishlist);
    }

    @Transactional
    public WishlistResponse removeItem(User user, Long variantId) {
        Wishlist wishlist = getOrCreateWishlist(user);
        WishlistItem item = wishlistItemRepository.findByWishlistIdAndVariantId(wishlist.getId(), variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in wishlist"));

        wishlistItemRepository.delete(item);

        return mapToResponse(wishlist);
    }

    private Wishlist getOrCreateWishlist(User user) {
        return wishlistRepository.findByUserId(user.getId())
                .orElseGet(() -> wishlistRepository.save(Wishlist.builder().user(user).build()));
    }

    private WishlistResponse mapToResponse(Wishlist wishlist) {
        List<WishlistItem> items = wishlistItemRepository.findByWishlistId(wishlist.getId());
        
        List<Long> variantIds = items.stream().map(i -> i.getVariant().getId()).collect(Collectors.toList());
        java.util.Map<Long, Integer> inventoryMap = inventoryService.getAvailableQuantities(variantIds);

        List<WishlistItemResponse> itemResponses = items.stream().map(item -> {
            boolean inStock = inventoryMap.getOrDefault(item.getVariant().getId(), 0) > 0;
            return WishlistItemResponse.builder()
                    .id(item.getId())
                    .variantId(item.getVariant().getId())
                    .productName(item.getVariant().getProduct().getName())
                    .sku(item.getVariant().getSku())
                    .attributes(item.getVariant().getAttributes())
                    .price(item.getVariant().getPrice())
                    .inStock(inStock)
                    .build();
        }).collect(Collectors.toList());

        return WishlistResponse.builder()
                .id(wishlist.getId())
                .items(itemResponses)
                .build();
    }
}
