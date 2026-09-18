package com.ashish.ecommerce.product;

import com.ashish.ecommerce.category.entity.Category;
import com.ashish.ecommerce.category.service.CategoryService;
import com.ashish.ecommerce.product.dto.ProductRequest;
import com.ashish.ecommerce.product.entity.Product;
import com.ashish.ecommerce.product.repository.ProductRepository;
import com.ashish.ecommerce.product.repository.ProductVariantRepository;
import com.ashish.ecommerce.product.service.ProductService;
import com.ashish.ecommerce.review.repository.ReviewRepository;
import com.ashish.ecommerce.seed.DummyJsonDataSeeder;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@SpringBootTest
@Import(ProductCacheTest.TestCacheConfig.class)
class ProductCacheTest {

    @TestConfiguration
    static class TestCacheConfig {
        @Bean
        @Primary
        public CacheManager testCacheManager() {
            return new ConcurrentMapCacheManager("products");
        }
    }

    @Autowired
    private ProductService productService;

    @Autowired
    private CacheManager cacheManager;

    @MockitoBean
    private ProductRepository productRepository;

    @MockitoBean
    private CategoryService categoryService;

    @MockitoBean
    private ReviewRepository reviewRepository;

    @MockitoBean
    private ProductVariantRepository productVariantRepository;

    @MockitoBean
    private DummyJsonDataSeeder dummyJsonDataSeeder;

    private Product product;
    private Category category;

    @BeforeEach
    void setUp() {
        if (cacheManager.getCache("products") != null) {
            cacheManager.getCache("products").clear();
        }

        category = Category.builder()
                .id(1L)
                .name("Test Category")
                .build();

        product = Product.builder()
                .id(1L)
                .name("Test Product")
                .category(category)
                .active(true)
                .build();

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(reviewRepository.findRatingStatsByProductIds(anyList())).thenReturn(Collections.emptyList());
        when(productVariantRepository.findPriceStatsByProductIds(anyList())).thenReturn(Collections.emptyList());
    }

    @Test
    void getProductById_shouldUseCache() {
        // 1st call: Verify cache miss triggers productRepository.findById(1L) once.
        productService.getProductById(1L);
        verify(productRepository, times(1)).findById(1L);

        // 2nd call: Verify cache hit returns the cached response and productRepository.findById(1L) is NOT called again (times(1)).
        productService.getProductById(1L);
        verify(productRepository, times(1)).findById(1L);
    }

    @Test
    void updateProduct_shouldEvictCache() {
        // Populate the cache by calling productService.getProductById(1L)
        productService.getProductById(1L);
        verify(productRepository, times(1)).findById(1L);

        // Setup request
        ProductRequest request = new ProductRequest();
        request.setName("Updated Product");
        request.setCategoryId(1L);
        request.setActive(true);

        when(categoryService.getCategoryEntityById(1L)).thenReturn(category);
        when(productRepository.save(any(Product.class))).thenReturn(product);

        // Trigger @CacheEvict by calling productService.updateProduct(1L, request)
        productService.updateProduct(1L, request);

        // Call productService.getProductById(1L) again and verify productRepository.findById(1L) was invoked (3 times total: get, update, get)
        productService.getProductById(1L);
        verify(productRepository, times(3)).findById(1L);
    }
}
