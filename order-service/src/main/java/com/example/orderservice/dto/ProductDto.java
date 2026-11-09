package com.example.orderservice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
public class ProductDto {
    private Long id;
    private String name;
    private BigDecimal price;
    private String description;
    private Integer stock;
    private Integer inventory;

    public ProductDto(Long id, String name, BigDecimal price, String description) {
        this(id, name, price, description, 0);
    }

    public ProductDto(Long id, String name, BigDecimal price, String description, Integer stock) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.description = description;
        this.stock = stock;
        this.inventory = stock;
    }

    public Integer getStock() {
        return stock != null ? stock : inventory;
    }
}
