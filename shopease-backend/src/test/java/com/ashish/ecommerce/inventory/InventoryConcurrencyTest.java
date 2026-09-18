package com.ashish.ecommerce.inventory;

import com.ashish.ecommerce.category.entity.Category;
import com.ashish.ecommerce.category.repository.CategoryRepository;
import com.ashish.ecommerce.common.exception.ConflictException;
import com.ashish.ecommerce.inventory.entity.Inventory;
import com.ashish.ecommerce.inventory.repository.InventoryRepository;
import com.ashish.ecommerce.inventory.service.InventoryService;
import com.ashish.ecommerce.product.entity.Product;
import com.ashish.ecommerce.product.entity.ProductVariant;
import com.ashish.ecommerce.product.repository.ProductRepository;
import com.ashish.ecommerce.product.repository.ProductVariantRepository;
import com.ashish.ecommerce.seed.DummyJsonDataSeeder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class InventoryConcurrencyTest {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @MockitoBean
    DummyJsonDataSeeder dummyJsonDataSeeder;

    @AfterEach
    void cleanup() {
        inventoryRepository.deleteAll();
        variantRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    @DisplayName("Two concurrent users buying last item: exactly one succeeds, stock becomes 0")
    void twoUsersBuyingLastItem_shouldAllowOnlyOnePurchase() throws Exception {
        Long variantId = createTestInventory(1);

        CountDownLatch gate = new CountDownLatch(1);

        Callable<Boolean> buy = () -> {
            gate.await();
            try {
                inventoryService.reduceInventory(variantId, 1);
                return true;
            } catch (ConflictException e) {
                return false;
            }
        };

        ExecutorService executor = Executors.newFixedThreadPool(2);
        Future<Boolean> userA = executor.submit(buy);
        Future<Boolean> userB = executor.submit(buy);

        gate.countDown();

        int successes = (userA.get() ? 1 : 0) + (userB.get() ? 1 : 0);
        executor.shutdown();

        assertEquals(1, successes);
        assertEquals(0, inventoryRepository.findByVariantId(variantId).orElseThrow().getAvailableQuantity());
    }

    @Test
    @DisplayName("High concurrency overselling protection: 10 threads compete for 3 items, exactly 3 succeed")
    void concurrentPurchases_shouldNeverOversell() throws Exception {
        int initialStock = 3;
        int totalThreads = 10;
        Long variantId = createTestInventory(initialStock);

        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneGate = new CountDownLatch(totalThreads);
        ExecutorService executor = Executors.newFixedThreadPool(totalThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        for (int i = 0; i < totalThreads; i++) {
            executor.submit(() -> {
                try {
                    startGate.await();
                    inventoryService.reduceInventory(variantId, 1);
                    successCount.incrementAndGet();
                } catch (ConflictException e) {
                    conflictCount.incrementAndGet();
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                } finally {
                    doneGate.countDown();
                }
            });
        }

        startGate.countDown();
        assertTrue(doneGate.await(10, TimeUnit.SECONDS));
        executor.shutdown();

        assertEquals(initialStock, successCount.get(), "Only initial stock count purchases must succeed");
        assertEquals(totalThreads - initialStock, conflictCount.get(), "All excess purchase requests must receive ConflictException");

        Inventory finalInventory = inventoryRepository.findByVariantId(variantId).orElseThrow();
        assertEquals(0, finalInventory.getAvailableQuantity(), "Final inventory stock must be exactly 0, never negative");
    }

    @Test
    @DisplayName("Optimistic locking: updating entity with stale @Version throws ObjectOptimisticLockingFailureException")
    void optimisticLocking_shouldRejectStaleVersion() {
        Long variantId = createTestInventory(10);
        Inventory inventoryA = inventoryRepository.findByVariantId(variantId).orElseThrow();
        Inventory inventoryB = inventoryRepository.findByVariantId(variantId).orElseThrow();

        // First transaction updates inventory
        inventoryA.setAvailableQuantity(8);
        inventoryRepository.saveAndFlush(inventoryA);

        // Second transaction tries to update using stale version of inventoryB
        inventoryB.setAvailableQuantity(5);
        assertThrows(ObjectOptimisticLockingFailureException.class, () -> {
            inventoryRepository.saveAndFlush(inventoryB);
        });
    }

    @Test
    @org.springframework.transaction.annotation.Transactional
    @DisplayName("Pessimistic locking: findByVariantIdForUpdate acquires and retrieves current entity")
    void pessimisticLocking_findByVariantIdForUpdate() {
        Long variantId = createTestInventory(5);
        var lockedInventoryOpt = inventoryRepository.findByVariantIdForUpdate(variantId);

        assertTrue(lockedInventoryOpt.isPresent());
        assertEquals(5, lockedInventoryOpt.get().getAvailableQuantity());
    }

    private Long createTestInventory(int quantity) {
        Category category = categoryRepository.save(
                Category.builder()
                        .name("Test Category " + System.nanoTime())
                        .build()
        );

        Product product = productRepository.save(
                Product.builder()
                        .name("Test Product " + System.nanoTime())
                        .category(category)
                        .active(true)
                        .build()
        );

        ProductVariant variant = variantRepository.save(
                ProductVariant.builder()
                        .product(product)
                        .sku("TEST-SKU-" + System.nanoTime())
                        .attributes("Default")
                        .price(new BigDecimal("100.00"))
                        .active(true)
                        .build()
        );

        inventoryRepository.save(
                Inventory.builder()
                        .variant(variant)
                        .availableQuantity(quantity)
                        .reservedQuantity(0)
                        .build()
        );

        return variant.getId();
    }
}