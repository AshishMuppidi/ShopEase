package com.ashish.ecommerce;

import com.ashish.ecommerce.seed.DummyJsonDataSeeder;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/**
 * Application context load test.
 * Uses H2 in-memory database (configured in src/test/resources/application.properties).
 * The DummyJsonDataSeeder is mocked to prevent HTTP calls to the external DummyJSON API
 * during automated tests.
 */
@SpringBootTest
class EcommerceApplicationTests {

    /**
     * Mock the seeder so it doesn't make real HTTP calls during context load tests.
     * All other beans are loaded normally to verify the Spring context wires correctly.
     */
    @MockitoBean
    DummyJsonDataSeeder dummyJsonDataSeeder;

    @Test
    void contextLoads() {
    }
}
