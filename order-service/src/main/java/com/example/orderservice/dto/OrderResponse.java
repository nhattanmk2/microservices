package com.example.orderservice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class OrderResponse {
    private Long orderId;
    private int quantity;
    private double originalPrice;
    private double discountAmount;
    private double totalPrice;
    private String promotionCode;
    private String status;
    private UserDto buyer;
    private ProductDto product;

    public OrderResponse(Long orderId, int quantity, double totalPrice, UserDto buyer, ProductDto product) {
        this(orderId, quantity, totalPrice, 0.0, totalPrice, null, "CREATED", buyer, product);
    }

    public OrderResponse(Long orderId, int quantity, double originalPrice, double discountAmount,
                         double totalPrice, String promotionCode, String status, UserDto buyer, ProductDto product) {
        this.orderId = orderId;
        this.quantity = quantity;
        this.originalPrice = originalPrice;
        this.discountAmount = discountAmount;
        this.totalPrice = totalPrice;
        this.promotionCode = promotionCode;
        this.status = status;
        this.buyer = buyer;
        this.product = product;
    }
}
