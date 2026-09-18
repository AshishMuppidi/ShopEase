package com.ashish.ecommerce.product.service;

import com.ashish.ecommerce.category.entity.Category;
import com.ashish.ecommerce.category.service.CategoryService;
import com.ashish.ecommerce.common.exception.ResourceNotFoundException;
import com.ashish.ecommerce.product.dto.ProductRequest;
import com.ashish.ecommerce.product.dto.ProductResponse;
import com.ashish.ecommerce.product.entity.Product;
import com.ashish.ecommerce.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryService categoryService;
    private final com.ashish.ecommerce.review.repository.ReviewRepository reviewRepository;
    private final com.ashish.ecommerce.product.repository.ProductVariantRepository productVariantRepository;

    public ProductResponse createProduct(ProductRequest request) {
        Category category = categoryService.getCategoryEntityById(request.getCategoryId());

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .brand(request.getBrand())
                .thumbnail(request.getThumbnail())
                .images(request.getImages())
                .category(category)
                .active(request.isActive())
                .build();

        return mapToResponseSimple(productRepository.save(product));
    }

    public Page<ProductResponse> getFilteredProducts(Long categoryId, String keyword, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice, Double minRating, Pageable pageable) {
        if (keyword != null && keyword.trim().isEmpty()) {
            keyword = null;
        } else if (keyword != null) {
            keyword = keyword.trim();
        }
        return enrichPage(productRepository.findFilteredProducts(categoryId, keyword, minPrice, maxPrice, minRating, pageable));
    }

    @Cacheable(value = "products",key = "#id")
    public ProductResponse getProductById(Long id) {
        return enrichList(java.util.Collections.singletonList(getProductEntityById(id))).get(0);
    }

    @CacheEvict(value = "products",key = "#id")
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = getProductEntityById(id);
        Category category = categoryService.getCategoryEntityById(request.getCategoryId());

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setBrand(request.getBrand());
        product.setThumbnail(request.getThumbnail());
        product.setImages(request.getImages());
        product.setCategory(category);
        product.setActive(request.isActive());

        return mapToResponseSimple(productRepository.save(product));
    }

    @CacheEvict(value = "products", key = "#id")
    public void deactivateProduct(Long id) {
        Product product = getProductEntityById(id);
        product.setActive(false);
        productRepository.save(product);
    }

    public List<ProductResponse> getRelatedProducts(Long productId) {
        Product product = getProductEntityById(productId);
        org.springframework.data.domain.Pageable limit = org.springframework.data.domain.PageRequest.of(0, 8);
        return enrichList(productRepository.findByCategoryIdAndIdNotOrderByIdDesc(product.getCategory().getId(), productId, limit));
    }

    public Page<ProductResponse> getDealsProducts(Pageable pageable) {
        return enrichPage(productRepository.findDeals(pageable));
    }

    public Product getProductEntityById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    private ProductResponse mapToResponse(Product product,
            java.util.Map<Long, Double> avgRatings,
            java.util.Map<Long, Long> reviewCounts,
            java.util.Map<Long, java.math.BigDecimal> minPrices,
            java.util.Map<Long, java.math.BigDecimal> discounts) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .brand(product.getBrand())
                .thumbnail(product.getThumbnail())
                .images(product.getImages())
                .active(product.isActive())
                .categoryId(product.getCategory().getId())
                .categoryName(product.getCategory().getName())
                .averageRating(avgRatings.getOrDefault(product.getId(), 0.0))
                .reviewCount(reviewCounts.getOrDefault(product.getId(), 0L))
                .minPrice(minPrices.get(product.getId()))
                .discountPercent(discounts.get(product.getId()))
                .build();
    }

    private ProductResponse mapToResponseSimple(Product product) {
        return mapToResponse(product,
                java.util.Collections.emptyMap(),
                java.util.Collections.emptyMap(),
                java.util.Collections.emptyMap(),
                java.util.Collections.emptyMap());
    }

    private Page<ProductResponse> enrichPage(Page<Product> page) {
        if (page.isEmpty()) return page.map(this::mapToResponseSimple);
        List<Long> ids = page.getContent().stream().map(Product::getId).collect(java.util.stream.Collectors.toList());
        java.util.Map<Long, Double> avgMap = new java.util.HashMap<>();
        java.util.Map<Long, Long> cntMap = new java.util.HashMap<>();
        java.util.Map<Long, java.math.BigDecimal> priceMap = new java.util.HashMap<>();
        java.util.Map<Long, java.math.BigDecimal> discountMap = new java.util.HashMap<>();
        populateRatingMaps(ids, avgMap, cntMap);
        populatePriceMaps(ids, priceMap, discountMap);
        return page.map(p -> mapToResponse(p, avgMap, cntMap, priceMap, discountMap));
    }

    private List<ProductResponse> enrichList(List<Product> products) {
        if (products.isEmpty()) return java.util.Collections.emptyList();
        List<Long> ids = products.stream().map(Product::getId).collect(java.util.stream.Collectors.toList());
        java.util.Map<Long, Double> avgMap = new java.util.HashMap<>();
        java.util.Map<Long, Long> cntMap = new java.util.HashMap<>();
        java.util.Map<Long, java.math.BigDecimal> priceMap = new java.util.HashMap<>();
        java.util.Map<Long, java.math.BigDecimal> discountMap = new java.util.HashMap<>();
        populateRatingMaps(ids, avgMap, cntMap);
        populatePriceMaps(ids, priceMap, discountMap);
        return products.stream().map(p -> mapToResponse(p, avgMap, cntMap, priceMap, discountMap)).collect(java.util.stream.Collectors.toList());
    }

    private void populateRatingMaps(List<Long> ids,
            java.util.Map<Long, Double> avgMap,
            java.util.Map<Long, Long> countMap) {
        reviewRepository.findRatingStatsByProductIds(ids).forEach(row -> {
            Long pid = (Long) row[0];
            avgMap.put(pid, row[1] != null ? ((Number) row[1]).doubleValue() : 0.0);
            countMap.put(pid, row[2] != null ? ((Number) row[2]).longValue() : 0L);
        });
    }

    private void populatePriceMaps(List<Long> ids,
            java.util.Map<Long, java.math.BigDecimal> priceMap,
            java.util.Map<Long, java.math.BigDecimal> discountMap) {
        productVariantRepository.findPriceStatsByProductIds(ids).forEach(row -> {
            Long pid = (Long) row[0];
            if (row[1] != null) priceMap.put(pid, new java.math.BigDecimal(row[1].toString()));
            if (row[2] != null) {
                java.math.BigDecimal disc = new java.math.BigDecimal(row[2].toString()).setScale(2, java.math.RoundingMode.HALF_UP);
                if (disc.compareTo(java.math.BigDecimal.ZERO) > 0) discountMap.put(pid, disc);
            }
        });
    }
}
