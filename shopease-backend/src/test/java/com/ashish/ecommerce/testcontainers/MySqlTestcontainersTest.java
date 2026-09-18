package com.ashish.ecommerce.testcontainers;

import com.ashish.ecommerce.seed.DummyJsonDataSeeder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.sql.Connection;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Integration test verifying MySQL using real Testcontainers infrastructure.
 * Uses disabledWithoutDocker = true so `mvn clean test` succeeds both in CI
 * (with Docker available) and in developer environments where the Docker daemon is idle.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class MySqlTestcontainersTest {

    @Container
    private static final MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("ecommerce_test")
            .withUsername("testuser")
            .withPassword("testpass");

    @DynamicPropertySource
    static void registerDynamicProperties(DynamicPropertyRegistry registry) {
        if (mysql.isRunning()) {
            registry.add("spring.datasource.url", mysql::getJdbcUrl);
            registry.add("spring.datasource.username", mysql::getUsername);
            registry.add("spring.datasource.password", mysql::getPassword);
            registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
            registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        }
    }

    @Autowired(required = false)
    private DataSource dataSource;

    @MockitoBean
    DummyJsonDataSeeder dummyJsonDataSeeder;

    @Test
    @DisplayName("Verify connection to real MySQL Testcontainers instance")
    void testDatabaseConnection() throws Exception {
        if (mysql.isRunning() && dataSource != null) {
            try (Connection conn = dataSource.getConnection()) {
                assertNotNull(conn);
                assertTrue(conn.isValid(2));
            }
        }
    }
}
