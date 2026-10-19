package com.example.orderservice.service;

import com.example.orderservice.client.AuthClient;
import com.example.orderservice.client.ProductClient;
import com.example.orderservice.client.PromotionClient;
import com.example.orderservice.dto.*;
import com.example.orderservice.entity.Order;
import com.example.orderservice.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.Collections;

@Service
@SuppressWarnings("null")
public class OrderService {

    private final OrderRepository orderRepository;
    private final AuthClient authClient;
    private final ProductClient productClient;
    private final PromotionClient promotionClient;

    public OrderService(OrderRepository orderRepository, AuthClient authClient,
                        ProductClient productClient, PromotionClient promotionClient) {
        this.orderRepository = orderRepository;
        this.authClient = authClient;
        this.productClient = productClient;
        this.promotionClient = promotionClient;
    }

    public Order createOrder(String buyerUsername, Long productId, int quantity) {
        return createOrder(buyerUsername, productId, quantity, null);
    }

    public Order createOrder(String buyerUsername, Long productId, int quantity, String promotionCode) {
        ProductDto product = productClient.getProductById(productId);
        double originalPrice = product.getPrice().doubleValue() * quantity;
        double discountAmount = 0.0;
        double finalPrice = originalPrice;

        String appliedCode = null;
        if (StringUtils.hasText(promotionCode)) {
            appliedCode = promotionCode.trim().toUpperCase();
            ApplyPromotionRequest promoRequest = ApplyPromotionRequest.builder()
                    .promotionCode(appliedCode)
                    .buyerUsername(buyerUsername)
                    .orderTotal(BigDecimal.valueOf(originalPrice))
                    .items(Collections.singletonList(
                            OrderItemDto.builder()
                                    .productId(productId)
                                    .quantity(quantity)
                                    .unitPrice(product.getPrice())
                                    .build()
                    ))
                    .build();

            ApplyPromotionResponse promoResponse = promotionClient.applyPromotion(promoRequest, buyerUsername);
            if (promoResponse != null && promoResponse.isValid()) {
                discountAmount = promoResponse.getDiscountAmount() != null
                        ? promoResponse.getDiscountAmount().doubleValue()
                        : 0.0;
                finalPrice = promoResponse.getFinalTotal() != null
                        ? promoResponse.getFinalTotal().doubleValue()
                        : originalPrice;
            }
        }

        Order order = Order.builder()
                .buyerUsername(buyerUsername)
                .productId(productId)
                .quantity(quantity)
                .promotionCode(appliedCode)
                .discountAmount(discountAmount)
                .totalPrice(finalPrice)
                .status("CREATED")
                .build();

        Order savedOrder = orderRepository.save(order);

        // Ghi nhận sử dụng voucher sau khi đơn hàng được lưu
        if (StringUtils.hasText(appliedCode) && discountAmount > 0) {
            ConsumePromotionRequest consumeRequest = ConsumePromotionRequest.builder()
                    .promotionCode(appliedCode)
                    .buyerUsername(buyerUsername)
                    .orderId(savedOrder.getId())
                    .discountAmount(BigDecimal.valueOf(discountAmount))
                    .build();
            promotionClient.consumePromotion(consumeRequest, buyerUsername);
        }

        return savedOrder;
    }

    public Order cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if ("CANCELLED".equalsIgnoreCase(order.getStatus())) {
            return order;
        }

        // Hoàn lại lượt sử dụng voucher nếu đơn hàng có áp dụng
        if (StringUtils.hasText(order.getPromotionCode())) {
            RefundPromotionRequest refundRequest = RefundPromotionRequest.builder()
                    .promotionCode(order.getPromotionCode())
                    .buyerUsername(order.getBuyerUsername())
                    .orderId(order.getId())
                    .reason("Huy don hang #" + order.getId())
                    .build();
            promotionClient.refundPromotion(refundRequest, order.getBuyerUsername());
        }

        order.setStatus("CANCELLED");
        return orderRepository.save(order);
    }

    public OrderResponse getOrderDetails(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        UserDto buyer = authClient.getUserByUsername(order.getBuyerUsername());
        ProductDto product = productClient.getProductById(order.getProductId());
        
        double originalPrice = product.getPrice().doubleValue() * order.getQuantity();
        double discountAmount = order.getDiscountAmount() != null ? order.getDiscountAmount() : 0.0;
        double totalPrice = (order.getTotalPrice() != null && order.getTotalPrice() > 0)
                ? order.getTotalPrice()
                : (originalPrice - discountAmount);

        return new OrderResponse(
                order.getId(),
                order.getQuantity(),
                originalPrice,
                discountAmount,
                totalPrice,
                order.getPromotionCode(),
                order.getStatus() != null ? order.getStatus() : "CREATED",
                buyer,
                product
        );
    }
}
