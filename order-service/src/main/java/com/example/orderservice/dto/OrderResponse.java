package com.example.orderservice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class OrderResponse {
    private Long orderId;
    private int quantity;
    private double totalPrice;
    private UserDto buyer;
    private ProductDto product;

    public OrderResponse(Long orderId, int quantity, double totalPrice, UserDto buyer, ProductDto product) {
        this.orderId = orderId;
        this.quantity = quantity;
        this.totalPrice = totalPrice;
        this.buyer = buyer;
        this.product = product;
    }
}
