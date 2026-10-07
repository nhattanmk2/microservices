package com.example.orderservice.service;

import com.example.orderservice.client.AuthClient;
import com.example.orderservice.client.ProductClient;
import com.example.orderservice.dto.OrderResponse;
import com.example.orderservice.dto.ProductDto;
import com.example.orderservice.dto.UserDto;
import com.example.orderservice.entity.Order;
import com.example.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final AuthClient authClient;
    private final ProductClient productClient;

    public Order createOrder(String buyerUsername, Long productId, int quantity) {
        return orderRepository.save(new Order(null, buyerUsername, productId, quantity));
    }

    public OrderResponse getOrderDetails(Long orderId) {
        // 1. Lấy đơn hàng từ Database
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // 2. Gọi sang Auth-Service qua Feign
        UserDto buyer = authClient.getUserByUsername(order.getBuyerUsername());
        
        // 3. Gọi sang Product-Service qua Feign
        ProductDto product = productClient.getProductById(order.getProductId());
        
        // 4. Tính tổng tiền
        double totalPrice = product.getPrice().doubleValue() * order.getQuantity();

        // 5. Gộp dữ liệu
        return new OrderResponse(
                order.getId(),
                order.getQuantity(),
                totalPrice,
                buyer,
                product
        );
    }
}
