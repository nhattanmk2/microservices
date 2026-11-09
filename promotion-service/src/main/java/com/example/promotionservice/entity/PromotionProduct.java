package com.example.promotionservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;

import javax.persistence.*;

@Entity
@Table(name = "promotion_products", indexes = {
        @Index(name = "idx_promo_prod_promo_id", columnList = "promotion_id"),
        @Index(name = "idx_promo_prod_product_id", columnList = "product_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Comment("Khoa chinh, dinh danh ban ghi lien ket")
    private Long id;

    @Column(name = "promotion_id", nullable = false)
    @Comment("Ma dinh danh chuong trinh khuyen mai (tham chieu promotions.id)")
    private Long promotionId;

    @Column(name = "product_id", nullable = false)
    @Comment("Ma dinh danh san pham duoc ap dung (tham chieu logic toi products.id)")
    private Long productId;
}
