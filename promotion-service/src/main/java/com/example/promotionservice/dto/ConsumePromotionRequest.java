package com.example.promotionservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsumePromotionRequest {
    private String promotionCode;
    private String buyerUsername;
    private Long orderId;
    private BigDecimal discountAmount;
}
