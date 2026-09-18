package com.ashish.ecommerce.product.service;

import com.ashish.ecommerce.common.exception.DuplicateResourceException;
import com.ashish.ecommerce.common.exception.ResourceNotFoundException;
import com.ashish.ecommerce.inventory.service.InventoryService;
import com.ashish.ecommerce.product.dto.ProductVariantRequest;
import com.ashish.ecommerce.product.dto.ProductVariantResponse;
import com.ashish.ecommerce.product.entity.Product;
import com.ashish.ecommerce.product.entity.ProductVariant;
import com.ashish.ecommerce.product.repository.ProductRepository;
import com.ashish.ecommerce.product.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductVariantService {

    private final ProductVariantRepository productVariantRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    private final CacheManager cacheManager;

    @Transactional
    public ProductVariantResponse createVariant(ProductVariantRequest request) {
        if (productVariantRepository.existsBySku(request.getSku())) {
            throw new DuplicateResourceException("SKU already exists");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .sku(request.getSku())
                .attributes(request.getAttributes())
                .price(request.getPrice())
                .active(request.isActive())
                .build();

        variant = productVariantRepository.save(variant);

        // Initialize inventory
        inventoryService.createInventoryForVariant(variant, request.getInitialInventory());
        evictProductCache(product.getId());

        return mapToResponse(variant, request.getInitialInventory());
    }

    public List<ProductVariantResponse> getVariantsByProduct(Long productId) {
        List<ProductVariant> variants = productVariantRepository.findByProductId(productId);
        
        List<Long> variantIds = variants.stream().map(ProductVariant::getId).collect(Collectors.toList());
        java.util.Map<Long, Integer> inventoryMap = inventoryService.getAvailableQuantities(variantIds);

        return variants.stream()
                .map(variant -> mapToResponse(variant, inventoryMap.getOrDefault(variant.getId(), 0)))
                .collect(Collectors.toList());
    }
    
    @Transactional
    public com.ashish.ecommerce.product.dto.ProductVariantResponse updateVariant(Long id, com.ashish.ecommerce.product.dto.ProductVariantUpdateRequest request) {
        ProductVariant variant = getVariantEntityById(id);
        variant.setAttributes(request.getAttributes());
        variant.setPrice(request.getPrice());
        variant.setOriginalPrice(request.getOriginalPrice());
        variant.setActive(request.isActive());
        variant = productVariantRepository.save(variant);
        evictProductCache(variant.getProduct().getId());
        Integer availableQuantity = inventoryService.getAvailableQuantity(id);
        return mapToResponse(variant, availableQuantity);
    }

    @Transactional
    public void deactivateVariant(Long id) {
        ProductVariant variant = getVariantEntityById(id);
        variant.setActive(false);
        productVariantRepository.save(variant);
        evictProductCache(variant.getProduct().getId());
    }

    private void evictProductCache(Long productId) {
        if (cacheManager != null && productId != null) {
            org.springframework.cache.Cache cache = cacheManager.getCache("products");
            if (cache != null) {
                cache.evict(productId);
            }
        }
    }

    public ProductVariant getVariantEntityById(Long id) {
        return productVariantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product Variant not found"));
    }

    public ProductVariantResponse getVariantById(Long id) {
        ProductVariant variant = getVariantEntityById(id);
        Integer availableQuantity = inventoryService.getAvailableQuantity(id);
        return mapToResponse(variant, availableQuantity);
    }

    private ProductVariantResponse mapToResponse(ProductVariant variant, Integer availableQuantity) {
        java.math.BigDecimal discountPercent = null;
        if (variant.getOriginalPrice() != null 
                && variant.getOriginalPrice().compareTo(java.math.BigDecimal.ZERO) > 0 
                && variant.getOriginalPrice().compareTo(variant.getPrice()) > 0) {
            discountPercent = variant.getOriginalPrice().subtract(variant.getPrice())
                    .divide(variant.getOriginalPrice(), 4, java.math.RoundingMode.HALF_UP)
                    .multiply(new java.math.BigDecimal("100"));
        }

        return ProductVariantResponse.builder()
                .id(variant.getId())
                .productId(variant.getProduct().getId())
                .sku(variant.getSku())
                .attributes(variant.getAttributes())
                .price(variant.getPrice())
                .originalPrice(variant.getOriginalPrice())
                .discountPercent(discountPercent)
                .active(variant.isActive())
                .availableQuantity(availableQuantity)
                .build();
    }
}
