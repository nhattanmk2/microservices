package com.example.promotionservice.dto;

import com.example.promotionservice.entity.DiscountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionResponseDto {
    private Long id;
    private String code;
    private String name;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal minOrderValue;
    private BigDecimal maxDiscountAmount;
    private Integer usageLimit;
    private Integer usedCount;
    private Integer remainingUsage;
    private Integer limitPerUser;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
    private List<Long> applicableProductIds;
    private LocalDateTime createdAt;
}
