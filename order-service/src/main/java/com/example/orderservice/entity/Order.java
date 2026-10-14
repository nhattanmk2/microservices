package com.example.orderservice.entity;

import lombok.Builder;
import lombok.Data;

import javax.persistence.*;

@Entity
@Table(name = "t_orders")
@Data
public class Order {
    
    public Order() {
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String buyerUsername;
    private Long productId;
    private int quantity;

    @Builder
    public Order(Long id, String buyerUsername, Long productId, int quantity) {
        this.id = id;
        this.buyerUsername = buyerUsername;
        this.productId = productId;
        this.quantity = quantity;
    }
}
