package com.ashish.ecommerce.cart.service;

import com.ashish.ecommerce.cart.dto.CartItemRequest;
import com.ashish.ecommerce.cart.dto.CartItemResponse;
import com.ashish.ecommerce.cart.dto.CartResponse;
import com.ashish.ecommerce.cart.entity.Cart;
import com.ashish.ecommerce.cart.entity.CartItem;
import com.ashish.ecommerce.cart.repository.CartItemRepository;
import com.ashish.ecommerce.cart.repository.CartRepository;
import com.ashish.ecommerce.common.exception.ResourceNotFoundException;
import com.ashish.ecommerce.inventory.service.InventoryService;
import com.ashish.ecommerce.product.entity.ProductVariant;
import com.ashish.ecommerce.product.service.ProductVariantService;
import com.ashish.ecommerce.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantService variantService;
    private final InventoryService inventoryService;

    @Transactional
    public CartResponse getCartResponse(User user) {
        Cart cart = getOrCreateCart(user);
        return mapToResponse(cart);
    }

    @Transactional
    public CartResponse addItem(User user, CartItemRequest request) {
        Cart cart = getOrCreateCart(user);
        ProductVariant variant = variantService.getVariantEntityById(request.getVariantId());

        if (!variant.isActive()) {
            throw new IllegalArgumentException("Product is not active");
        }

        int availableQty = inventoryService.getAvailableQuantity(variant.getId());
        if (request.getQuantity() > availableQty) {
            throw new IllegalArgumentException("Not enough inventory available");
        }

        Optional<CartItem> existingItem = cartItemRepository.findByCartIdAndVariantId(cart.getId(), variant.getId());

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            int newQuantity = item.getQuantity() + request.getQuantity();
            if (newQuantity > availableQty) {
                throw new IllegalArgumentException("Cannot add more than available inventory");
            }
            item.setQuantity(newQuantity);
            cartItemRepository.save(item);
        } else {
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .variant(variant)
                    .quantity(request.getQuantity())
                    .build();
            cartItemRepository.save(item);
        }

        return mapToResponse(cart);
    }

    @Transactional
    public CartResponse updateItemQuantity(User user, Long variantId, Integer quantity) {
        if (quantity == null || quantity < 1) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }

        Cart cart = getOrCreateCart(user);
        CartItem item = cartItemRepository.findByCartIdAndVariantId(cart.getId(), variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in cart"));

        int availableQty = inventoryService.getAvailableQuantity(variantId);
        if (quantity > availableQty) {
            throw new IllegalArgumentException("Not enough inventory available");
        }

        item.setQuantity(quantity);
        cartItemRepository.save(item);

        return mapToResponse(cart);
    }

    @Transactional
    public CartResponse removeItem(User user, Long variantId) {
        Cart cart = getOrCreateCart(user);
        CartItem item = cartItemRepository.findByCartIdAndVariantId(cart.getId(), variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in cart"));

        cartItemRepository.delete(item);

        return mapToResponse(cart);
    }

    @Transactional
    public CartResponse clearCart(User user) {
        Cart cart = getOrCreateCart(user);
        cartItemRepository.deleteByCartId(cart.getId());
        return mapToResponse(cart);
    }

    private Cart getOrCreateCart(User user) {
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));
    }

    private CartResponse mapToResponse(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());

        List<CartItemResponse> itemResponses = items.stream().map(item -> {
            BigDecimal subTotal = item.getVariant().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            return CartItemResponse.builder()
                    .id(item.getId())
                    .variantId(item.getVariant().getId())
                    .productName(item.getVariant().getProduct().getName())
                    .sku(item.getVariant().getSku())
                    .attributes(item.getVariant().getAttributes())
                    .unitPrice(item.getVariant().getPrice())
                    .quantity(item.getQuantity())
                    .subTotal(subTotal)
                    .build();
        }).collect(Collectors.toList());

        BigDecimal totalPrice = itemResponses.stream()
                .map(CartItemResponse::getSubTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .id(cart.getId())
                .items(itemResponses)
                .totalPrice(totalPrice)
                .build();
    }
}
