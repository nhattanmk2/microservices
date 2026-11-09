package com.example.productservice.entity;

import lombok.Builder;
import lombok.Data;
import org.hibernate.annotations.Comment;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
public class Product {

    public Product() {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Comment("Khoa chinh, dinh danh duy nhat cua san pham")
    private Long id;

    @Column(nullable = false)
    @Comment("Ten san pham thuong mai")
    private String name;

    @Comment("Mo ta chi tiet ve dac tinh, thong so san pham")
    private String description;

    @Column(nullable = false)
    @Comment("Gia niem yet cua san pham (don vi: VND)")
    private BigDecimal price;

    @Comment("So luong san pham con ton trong kho hang")
    private Integer stock;

    @Column(name = "created_at")
    @Comment("Thoi diem san pham duoc tao va nhap vao he thong")
    private LocalDateTime createdAt;

    @Builder
    public Product(Long id, String name, String description, BigDecimal price, Integer stock, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.stock = stock;
        this.createdAt = createdAt;
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
