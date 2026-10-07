package com.example.orderservice.controller;

import com.example.orderservice.dto.OrderResponse;
import com.example.orderservice.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.orderservice.entity.Order;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(orderService.getOrderDetails(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }


    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestParam String buyerUsername, 
                                             @RequestParam Long productId, 
                                             @RequestParam int quantity) {
        return ResponseEntity.ok(orderService.createOrder(buyerUsername, productId, quantity));
    }
}
