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
    private String promotionCode;
    private Double discountAmount;
    private Double totalPrice;
    private String status;

    public Order(Long id, String buyerUsername, Long productId, int quantity) {
        this(id, buyerUsername, productId, quantity, null, 0.0, 0.0, "CREATED");
    }

    @Builder
    public Order(Long id, String buyerUsername, Long productId, int quantity,
                 String promotionCode, Double discountAmount, Double totalPrice, String status) {
        this.id = id;
        this.buyerUsername = buyerUsername;
        this.productId = productId;
        this.quantity = quantity;
        this.promotionCode = promotionCode;
        this.discountAmount = discountAmount != null ? discountAmount : 0.0;
        this.totalPrice = totalPrice != null ? totalPrice : 0.0;
        this.status = status != null ? status : "CREATED";
    }

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = "CREATED";
        }
        if (this.discountAmount == null) {
            this.discountAmount = 0.0;
        }
    }
}
