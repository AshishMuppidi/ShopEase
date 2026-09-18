package com.ashish.ecommerce.product.controller;

import com.ashish.ecommerce.product.dto.ProductVariantRequest;
import com.ashish.ecommerce.product.dto.ProductVariantResponse;
import com.ashish.ecommerce.product.service.ProductVariantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ProductVariantController {

    private final ProductVariantService productVariantService;

    // --- Public Endpoints ---
    @GetMapping("/api/products/{productId}/variants")
    public ResponseEntity<List<ProductVariantResponse>> getVariantsByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(productVariantService.getVariantsByProduct(productId));
    }

    @GetMapping("/api/variants/{id}")
    public ResponseEntity<ProductVariantResponse> getVariantById(@PathVariable Long id) {
        return ResponseEntity.ok(productVariantService.getVariantById(id));
    }

    // --- Admin Endpoints ---
    @PostMapping("/api/admin/variants")
    public ResponseEntity<ProductVariantResponse> createVariant(@Valid @RequestBody ProductVariantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productVariantService.createVariant(request));
    }

    @DeleteMapping("/api/admin/variants/{id}")
    public ResponseEntity<Void> deleteVariant(@PathVariable Long id) {
        productVariantService.deactivateVariant(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/api/admin/variants/{id}")
    public ResponseEntity<ProductVariantResponse> updateVariant(
            @PathVariable Long id,
            @Valid @RequestBody com.ashish.ecommerce.product.dto.ProductVariantUpdateRequest request) {
        return ResponseEntity.ok(productVariantService.updateVariant(id, request));
    }
}
