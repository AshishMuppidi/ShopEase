package com.ashish.ecommerce.auth;

import com.ashish.ecommerce.auth.service.CustomUserDetailsService;
import com.ashish.ecommerce.auth.service.JwtService;
import com.ashish.ecommerce.seed.DummyJsonDataSeeder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class SecurityAuthorizationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @MockitoBean
    DummyJsonDataSeeder dummyJsonDataSeeder;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    @Test
    @DisplayName("Public endpoints like /api/products allow unauthenticated access")
    void publicEndpoints_allowUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Admin endpoints reject unauthenticated requests with 401/403")
    void adminEndpoints_rejectUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "customer@example.com", roles = {"CUSTOMER"})
    @DisplayName("Admin endpoints reject users with only ROLE_CUSTOMER")
    void adminEndpoints_rejectCustomerRole() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    @DisplayName("Admin endpoints permit users with ROLE_ADMIN")
    void adminEndpoints_permitAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Payment webhook allows unauthenticated requests with HMAC validation")
    void webhook_permitsUnauthenticatedAccess() throws Exception {
        mockMvc.perform(post("/api/payments/webhook")
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
