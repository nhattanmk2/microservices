package com.example.orderservice.controller;

import com.example.orderservice.dto.OrderResponse;
import com.example.orderservice.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.orderservice.entity.Order;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(
            @RequestHeader(value = "X-Auth-Username", required = false) String headerUsername,
            @RequestParam(value = "username", required = false) String paramUsername) {
        String buyerUsername = org.springframework.util.StringUtils.hasText(headerUsername) ? headerUsername : paramUsername;
        if (!org.springframework.util.StringUtils.hasText(buyerUsername)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(orderService.getMyOrders(buyerUsername));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload) {
        String status = payload.get("status");
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(orderService.getOrderDetails(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }


    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestHeader("X-Auth-Username") String buyerUsername, 
                                             @RequestParam Long productId, 
                                             @RequestParam int quantity,
                                             @RequestParam(required = false) String promotionCode) {
        return ResponseEntity.ok(orderService.createOrder(buyerUsername, productId, quantity, promotionCode));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(id));
    }
}
