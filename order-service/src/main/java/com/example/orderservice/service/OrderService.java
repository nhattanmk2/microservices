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

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class OrderService {

    private final OrderRepository orderRepository;
    private final AuthClient authClient;
    private final ProductClient productClient;

    public Order createOrder(String buyerUsername, Long productId, int quantity) {
        return orderRepository.save(new Order(null, buyerUsername, productId, quantity));
    }

    public OrderResponse getOrderDetails(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        UserDto buyer = authClient.getUserByUsername(order.getBuyerUsername());
        ProductDto product = productClient.getProductById(order.getProductId());
        
        double totalPrice = product.getPrice().doubleValue() * order.getQuantity();

        return new OrderResponse(
                order.getId(),
                order.getQuantity(),
                totalPrice,
                buyer,
                product
        );
    }
}
