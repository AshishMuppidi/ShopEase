package com.ashish.ecommerce.admin.service;

import com.ashish.ecommerce.admin.dto.DashboardResponse;
import com.ashish.ecommerce.inventory.repository.InventoryRepository;
import com.ashish.ecommerce.order.entity.Order;
import com.ashish.ecommerce.order.repository.OrderRepository;
import com.ashish.ecommerce.product.repository.ProductRepository;
import com.ashish.ecommerce.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        long totalUsers = userRepository.count();
        long totalProducts = productRepository.countByActiveTrue();
        long totalOrders = orderRepository.count();

        BigDecimal totalRevenue = orderRepository.sumTotalRevenue();
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        long pendingOrders = orderRepository.countByStatus(
                com.ashish.ecommerce.order.entity.OrderStatus.PENDING);

        long lowStockVariants = inventoryRepository.countLowStock(5);

        List<Order> recent = orderRepository.findAll(
                PageRequest.of(0, 5, Sort.by("createdAt").descending())).getContent();

        List<DashboardResponse.RecentOrderItem> recentItems = recent.stream().map(o ->
                DashboardResponse.RecentOrderItem.builder()
                        .orderId(o.getId())
                        .customerName(o.getUser().getName())
                        .status(o.getStatus().name())
                        .total(o.getTotalAmount())
                        .createdAt(o.getCreatedAt())
                        .build()
        ).collect(Collectors.toList());

        return DashboardResponse.builder()
                .totalUsers(totalUsers)
                .totalProducts(totalProducts)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .pendingOrders(pendingOrders)
                .lowStockVariants(lowStockVariants)
                .recentOrders(recentItems)
                .build();
    }
}
