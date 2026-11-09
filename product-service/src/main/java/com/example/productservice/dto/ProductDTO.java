package com.example.productservice.dto;

import java.io.Serializable;
import java.math.BigDecimal;

public class ProductDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private BigDecimal price;
    private String description;
    private Integer stock;
    private Integer inventory;

    public ProductDTO() {}

    public ProductDTO(Long id, String name, BigDecimal price, String description) {
        this(id, name, price, description, 0);
    }

    public ProductDTO(Long id, String name, BigDecimal price, String description, Integer stock) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.description = description;
        this.stock = stock;
        this.inventory = stock;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getStock() {
        return stock != null ? stock : inventory;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
        this.inventory = stock;
    }

    public Integer getInventory() {
        return inventory != null ? inventory : stock;
    }

    public void setInventory(Integer inventory) {
        this.inventory = inventory;
        this.stock = inventory;
    }
}
