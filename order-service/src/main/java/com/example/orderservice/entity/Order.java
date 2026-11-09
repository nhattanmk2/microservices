package com.example.orderservice.entity;

import lombok.Builder;
import lombok.Data;
import org.hibernate.annotations.Comment;

import javax.persistence.*;

@Entity
@Table(name = "t_orders")
@Data
public class Order {
    
    public Order() {
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Comment("Khoa chinh, ma dinh danh duy nhat cua don hang")
    private Long id;
    
    @Column(name = "buyer_username")
    @Comment("Ten tai khoan nguoi mua hang (tham chieu logic toi users.username)")
    private String buyerUsername;
    
    @Column(name = "product_id")
    @Comment("Ma dinh danh san pham duoc dat mua (tham chieu logic toi products.id)")
    private Long productId;
    
    @Comment("So luong san pham duoc dat trong don hang")
    private int quantity;
    
    @Column(name = "promotion_code")
    @Comment("Ma voucher giam gia da duoc ap dung (tham chieu logic toi promotions.code)")
    private String promotionCode;
    
    @Column(name = "discount_amount")
    @Comment("So tien duoc chiet khau giam gia tu voucher")
    private Double discountAmount;
    
    @Column(name = "total_price")
    @Comment("Tong so tien khach hang can thanh toan thuc te sau giam gia")
    private Double totalPrice;
    
    @Comment("Trang thai don hang: CREATED (Da tao) hoac CANCELLED (Da huy)")
    private String status;

    public Order(Long id, String buyerUsername, Long productId, int quantity) {
        this(id, buyerUsername, productId, quantity, null, 0.0, 0.0, "CREATED");
    }

    @Builder
    public Order(Long id, String buyerUsername, Long productId, int quantity,
                 String promotionCode, Double discountAmount, Double totalPrice, String status) {
        this.id = id;
        this.buyerUsername = buyerUsername;
        this.productId = productId;
        this.quantity = quantity;
        this.promotionCode = promotionCode;
        this.discountAmount = discountAmount != null ? discountAmount : 0.0;
        this.totalPrice = totalPrice != null ? totalPrice : 0.0;
        this.status = status != null ? status : "CREATED";
    }

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = "CREATED";
        }
        if (this.discountAmount == null) {
            this.discountAmount = 0.0;
        }
    }
}
