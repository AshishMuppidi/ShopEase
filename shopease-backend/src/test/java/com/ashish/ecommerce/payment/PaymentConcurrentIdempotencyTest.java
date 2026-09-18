package com.ashish.ecommerce.payment;

import com.ashish.ecommerce.category.entity.Category;
import com.ashish.ecommerce.category.repository.CategoryRepository;
import com.ashish.ecommerce.order.entity.Address;
import com.ashish.ecommerce.order.entity.Order;
import com.ashish.ecommerce.order.entity.OrderStatus;
import com.ashish.ecommerce.order.repository.OrderRepository;
import com.ashish.ecommerce.payment.dto.PaymentIntentRequest;
import com.ashish.ecommerce.payment.dto.PaymentIntentResponse;
import com.ashish.ecommerce.payment.repository.PaymentRepository;
import com.ashish.ecommerce.payment.service.PaymentService;
import com.ashish.ecommerce.seed.DummyJsonDataSeeder;
import com.ashish.ecommerce.user.entity.Role;
import com.ashish.ecommerce.user.entity.User;
import com.ashish.ecommerce.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PaymentConcurrentIdempotencyTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @MockitoBean
    DummyJsonDataSeeder dummyJsonDataSeeder;

    @AfterEach
    void cleanup() {
        paymentRepository.deleteAll();
        orderRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    @DisplayName("Concurrent duplicate payment requests with same idempotencyKey never create duplicate payments")
    void concurrentPaymentRequests_shouldNeverCreateDuplicatePayments() throws Exception {
        User user = userRepository.save(
                User.builder()
                        .name("Test User")
                        .email("testuser_" + System.nanoTime() + "@example.com")
                        .password("encoded_pass")
                        .role(Role.CUSTOMER)
                        .build()
        );

        Order order = orderRepository.save(
                Order.builder()
                        .user(user)
                        .status(OrderStatus.PENDING)
                        .totalAmount(new BigDecimal("99.99"))
                        .shippingAddress(Address.builder()
                                .fullName("Test User")
                                .phone("1234567890")
                                .street("123 Test St")
                                .city("City")
                                .state("State")
                                .zipCode("12345")
                                .country("Country")
                                .build())
                        .build()
        );

        String sharedIdempotencyKey = "concurrent-key-" + System.nanoTime();
        int threadCount = 2;
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch endGate = new CountDownLatch(threadCount);
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        AtomicInteger successfulRequests = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startGate.await();
                    PaymentIntentRequest request = new PaymentIntentRequest();
                    request.setOrderId(order.getId());
                    request.setIdempotencyKey(sharedIdempotencyKey);

                    PaymentIntentResponse response = paymentService.createPaymentIntent(user, request);
                    if (response != null && sharedIdempotencyKey.equals(response.getIdempotencyKey())) {
                        successfulRequests.incrementAndGet();
                    }
                } catch (Exception ignored) {
                    // One request might hit unique constraint conflict during simultaneous commit
                } finally {
                    endGate.countDown();
                }
            });
        }

        startGate.countDown();
        assertTrue(endGate.await(10, TimeUnit.SECONDS));
        executor.shutdown();

        // Database must contain EXACTLY 1 payment record for this order / idempotency key
        assertEquals(1, paymentRepository.count(), "Exactly one payment record must exist in database");
        assertTrue(successfulRequests.get() >= 1, "At least one thread must successfully receive the payment intent");

        var persistedPayment = paymentRepository.findByIdempotencyKey(sharedIdempotencyKey);
        assertTrue(persistedPayment.isPresent());
        assertEquals(order.getId(), persistedPayment.get().getOrder().getId());
    }
}
