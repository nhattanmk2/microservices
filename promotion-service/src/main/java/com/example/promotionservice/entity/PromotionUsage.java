package com.example.promotionservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "promotion_usages", indexes = {
        @Index(name = "idx_promo_usage_promo_id", columnList = "promotion_id"),
        @Index(name = "idx_promo_usage_user", columnList = "buyer_username"),
        @Index(name = "idx_promo_usage_order", columnList = "order_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "promotion_id", nullable = false)
    private Long promotionId;

    @Column(name = "promotion_code", nullable = false, length = 50)
    private String promotionCode;

    @Column(name = "buyer_username", nullable = false, length = 100)
    private String buyerUsername;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "USED";

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @PrePersist
    public void prePersist() {
        if (usedAt == null) {
            usedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "USED";
        }
    }
}
