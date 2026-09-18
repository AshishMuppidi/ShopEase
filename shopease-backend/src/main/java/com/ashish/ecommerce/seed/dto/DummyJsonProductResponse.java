package com.ashish.ecommerce.seed.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DummyJsonProductResponse {

    private List<DummyJsonProduct> products;
    private Integer total;
    private Integer skip;
    private Integer limit;
}
