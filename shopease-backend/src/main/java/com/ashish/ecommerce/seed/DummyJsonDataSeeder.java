package com.ashish.ecommerce.seed;

import com.ashish.ecommerce.category.entity.Category;
import com.ashish.ecommerce.category.repository.CategoryRepository;
import com.ashish.ecommerce.inventory.service.InventoryService;
import com.ashish.ecommerce.product.entity.Product;
import com.ashish.ecommerce.product.entity.ProductVariant;
import com.ashish.ecommerce.product.repository.ProductRepository;
import com.ashish.ecommerce.product.repository.ProductVariantRepository;
import com.ashish.ecommerce.seed.dto.DummyJsonProduct;
import com.ashish.ecommerce.seed.dto.DummyJsonProductResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@ConditionalOnProperty(name = "dummyjson.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
@Slf4j
public class DummyJsonDataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryService inventoryService;

    @Value("${dummyjson.products-url:https://dummyjson.com/products?limit=30}")
    private String productsUrl;

    @Override
    public void run(String... args) {
        if (productRepository.count() != 0) {
            return;
        }

        log.info("No products found. Starting DummyJSON seed from {}", productsUrl);

        try {
            RestClient restClient = RestClient.create();

            DummyJsonProductResponse response = restClient.get()
                    .uri(productsUrl)
                    .retrieve()
                    .body(DummyJsonProductResponse.class);

            if (response == null || response.getProducts() == null || response.getProducts().isEmpty()) {
                log.warn("DummyJSON returned no products to seed");
                return;
            }

            for (DummyJsonProduct dummy : response.getProducts()) {
                Category category = categoryRepository.findByName(dummy.getCategory())
                        .orElseGet(() -> categoryRepository.save(
                                Category.builder()
                                        .name(dummy.getCategory())
                                        .description("DummyJSON seeded category")
                                        .build()
                        ));

                Product product = Product.builder()
                        .name(dummy.getTitle())
                        .description(dummy.getDescription())
                        .brand(dummy.getBrand())
                        .thumbnail(dummy.getThumbnail())
                        .images(dummy.getImages())
                        .category(category)
                        .active(true)
                        .build();

                product = productRepository.save(product);

                ProductVariant variant = ProductVariant.builder()
                        .product(product)
                        .sku("DUMMY-" + dummy.getId())
                        .attributes("Default")
                        .price(dummy.getPrice())
                        .active(true)
                        .build();

                variant = productVariantRepository.save(variant);

                inventoryService.createInventoryForVariant(variant, dummy.getStock());
            }

            log.info("DummyJSON seed completed successfully. Products inserted: {}", response.getProducts().size());
        } catch (Exception e) {
            log.error("Failed to seed initial products from DummyJSON: {}", e.getMessage());
        }
    }
}
