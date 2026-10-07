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

import javax.annotation.PostConstruct;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final AuthClient authClient;
    private final ProductClient productClient;

    // Tạo sẵn 1 đơn hàng mẫu vào DB lúc khởi động để test cho nhanh
    @PostConstruct
    public void initDummyOrder() {
        if (orderRepository.count() == 0) {
            orderRepository.save(new Order(null, "admin", 1L, 2));
        }
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
