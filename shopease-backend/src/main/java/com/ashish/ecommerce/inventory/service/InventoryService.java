package com.ashish.ecommerce.inventory.service;

import com.ashish.ecommerce.common.exception.ConflictException;
import com.ashish.ecommerce.common.exception.ResourceNotFoundException;
import com.ashish.ecommerce.inventory.entity.Inventory;
import com.ashish.ecommerce.inventory.repository.InventoryRepository;
import com.ashish.ecommerce.product.entity.ProductVariant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    @Transactional
    public void createInventoryForVariant(ProductVariant variant, Integer initialQuantity) {
        if (initialQuantity == null || initialQuantity < 0) {
            throw new IllegalArgumentException("Initial inventory cannot be negative");
        }

        Inventory inventory = Inventory.builder()
                .variant(variant)
                .availableQuantity(initialQuantity)
                .reservedQuantity(0)
                .build();
        inventoryRepository.save(inventory);
    }

    public Inventory getInventoryByVariantId(Long variantId) {
        return inventoryRepository.findByVariantId(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for variant"));
    }

    public Integer getAvailableQuantity(Long variantId) {
        return getInventoryByVariantId(variantId).getAvailableQuantity();
    }

    public java.util.Map<Long, Integer> getAvailableQuantities(java.util.List<Long> variantIds) {
        return inventoryRepository.findByVariantIdIn(variantIds).stream()
                .collect(java.util.stream.Collectors.toMap(
                        inv -> inv.getVariant().getId(),
                        Inventory::getAvailableQuantity
                ));
    }

    @Transactional
    public void reduceInventory(Long variantId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Inventory quantity must be positive");
        }

        Inventory inventory = inventoryRepository.findByVariantIdForUpdate(variantId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Inventory not found for variant: " + variantId
                        ));

        if (inventory.getAvailableQuantity() < quantity) {
            throw new ConflictException(
                    "Not enough inventory available for variant: " + variantId
            );
        }

        inventory.setAvailableQuantity(
                inventory.getAvailableQuantity() - quantity
        );

        inventoryRepository.save(inventory);
    }
    @Transactional
    public void restoreInventory(Long variantId, int quantity) {

        if (quantity <= 0) {
            throw new IllegalArgumentException(
                    "Inventory quantity must be positive");
        }

        Inventory inventory = inventoryRepository
                .findByVariantIdForUpdate(variantId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Inventory not found for variant: "
                                        + variantId));

        inventory.setAvailableQuantity(
                inventory.getAvailableQuantity() + quantity
        );

        inventoryRepository.save(inventory);
    }
}
