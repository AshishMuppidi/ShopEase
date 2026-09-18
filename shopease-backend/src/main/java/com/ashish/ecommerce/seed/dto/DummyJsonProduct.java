package com.ashish.ecommerce.seed.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DummyJsonProduct {

    private Long id;
    private String title;
    private String description;
    private String category;
    private String brand;
    private BigDecimal price;
    private Integer stock;
    private String thumbnail;
    private List<String> images;
}
