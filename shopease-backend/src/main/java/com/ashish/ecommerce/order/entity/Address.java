package com.ashish.ecommerce.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {
    
    @Column(nullable = false, length = 100)
    private String fullName;
    
    @Column(nullable = false, length = 20)
    private String phone;
    
    @Column(nullable = false, length = 200)
    private String street;
    
    @Column(nullable = false, length = 100)
    private String city;
    
    @Column(nullable = false, length = 100)
    private String state;
    
    @Column(nullable = false, length = 20)
    private String zipCode;
    
    @Column(nullable = false, length = 100)
    private String country;
}
