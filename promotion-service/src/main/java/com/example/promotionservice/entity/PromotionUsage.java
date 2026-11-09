package com.example.promotionservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;

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
    @Comment("Khoa chinh, dinh danh ban ghi tieu dung voucher")
    private Long id;

    @Column(name = "promotion_id", nullable = false)
    @Comment("Ma dinh danh chuong trinh khuyen mai (tham chieu promotions.id)")
    private Long promotionId;

    @Column(name = "promotion_code", nullable = false, length = 50)
    @Comment("Ma voucher da duoc khach hang su dung")
    private String promotionCode;

    @Column(name = "buyer_username", nullable = false, length = 100)
    @Comment("Ten tai khoan nguoi mua hang da dung voucher (tham chieu logic toi users.username)")
    private String buyerUsername;

    @Column(name = "order_id", nullable = false)
    @Comment("Ma don hang ap dung voucher nay (tham chieu logic toi t_orders.id)")
    private Long orderId;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    @Comment("So tien thuc te da duoc chiet khau giam gia cho don hang")
    private BigDecimal discountAmount;

    @Column(nullable = false, length = 20)
    @Comment("Trang thai luot dung: USED (Da dung) hoac REFUNDED (Da hoan lai khi huy don)")
    @Builder.Default
    private String status = "USED";

    @Column(name = "used_at")
    @Comment("Thoi diem khach hang su dung voucher de tao don hang")
    private LocalDateTime usedAt;

    @Column(name = "refunded_at")
    @Comment("Thoi diem he thong hoan tra lai luot dung voucher khi don hang bi huy")
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
