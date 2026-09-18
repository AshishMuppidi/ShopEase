package com.ashish.ecommerce.admin.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardResponse {
    private long totalUsers;
    private long totalProducts;
    private long totalOrders;
    private BigDecimal totalRevenue;
    private long pendingOrders;
    private long lowStockVariants;   // inventory < 5
    private List<RecentOrderItem> recentOrders;

    @Data
    @Builder
    public static class RecentOrderItem {
        private Long orderId;
        private String customerName;
        private String status;
        private BigDecimal total;
        private java.time.LocalDateTime createdAt;
    }
}
