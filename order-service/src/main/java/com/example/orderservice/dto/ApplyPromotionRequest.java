package com.example.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyPromotionRequest {
    private String promotionCode;
    private String buyerUsername;
    private BigDecimal orderTotal;
    private List<OrderItemDto> items;
}
