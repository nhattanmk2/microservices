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
@Table(name = "promotions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Comment("Khoa chinh, ma dinh danh duy nhat cua voucher")
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    @Comment("Ma code voucher nguoi dung nhap vao (duy nhat toan he thong)")
    private String code;

    @Column(nullable = false, length = 150)
    @Comment("Ten chuong trinh khuyen mai")
    private String name;

    @Column(columnDefinition = "TEXT")
    @Comment("Mo ta chi tiet dieu kien va the le ap dung voucher")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    @Comment("Loai hinh chiet khau: PERCENTAGE (theo %) hoac FIXED_AMOUNT (so tien co dinh)")
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    @Comment("Gia tri giam gia: ty le % (neu PERCENTAGE) hoac so tien VND (neu FIXED_AMOUNT)")
    private BigDecimal discountValue;

    @Column(name = "min_order_value", precision = 12, scale = 2)
    @Comment("Gia tri don hang toi thieu can dat de duoc ap dung voucher")
    private BigDecimal minOrderValue;

    @Column(name = "max_discount_amount", precision = 12, scale = 2)
    @Comment("So tien giam toi da (ap dung khi discount_type la PERCENTAGE)")
    private BigDecimal maxDiscountAmount;

    @Column(name = "usage_limit", nullable = false)
    @Comment("Tong so luot su dung toi da cua voucher tren toan he thong")
    @Builder.Default
    private Integer usageLimit = 100;

    @Column(name = "used_count", nullable = false)
    @Comment("So luot voucher da duoc khach hang tieu dung thuc te")
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "limit_per_user", nullable = false)
    @Comment("So luot toi da mot tai khoan nguoi dung duoc phep ap dung voucher")
    @Builder.Default
    private Integer limitPerUser = 1;

    @Column(name = "start_date", nullable = false)
    @Comment("Thoi diem bat dau co hieu luc cua voucher")
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    @Comment("Thoi diem het han cua voucher")
    private LocalDateTime endDate;

    @Column(name = "is_active", nullable = false)
    @Comment("Trang thai kich hoat cua voucher: true (dang hoat dong), false (tam dung)")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    @Comment("Thoi diem tao chuong trinh voucher")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (code != null) {
            code = code.trim().toUpperCase();
        }
        if (usageLimit == null) {
            usageLimit = 100;
        }
        if (usedCount == null) {
            usedCount = 0;
        }
        if (limitPerUser == null) {
            limitPerUser = 1;
        }
        if (isActive == null) {
            isActive = true;
        }
    }
}
