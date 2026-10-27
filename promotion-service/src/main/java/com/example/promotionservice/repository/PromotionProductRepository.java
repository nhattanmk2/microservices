package com.example.promotionservice.repository;

import com.example.promotionservice.entity.PromotionProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromotionProductRepository extends JpaRepository<PromotionProduct, Long> {

    List<PromotionProduct> findByPromotionId(Long promotionId);

    List<PromotionProduct> findByProductId(Long productId);

    boolean existsByPromotionId(Long promotionId);

    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM PromotionProduct p WHERE p.promotionId = :promotionId AND p.productId = :productId")
    boolean existsByProduct(@Param("promotionId") Long promotionId, @Param("productId") Long productId);

    void deleteByPromotionId(Long promotionId);
}
