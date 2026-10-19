package com.example.promotionservice.repository;

import com.example.promotionservice.entity.PromotionProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromotionProductRepository extends JpaRepository<PromotionProduct, Long> {

    List<PromotionProduct> findByPromotionId(Long promotionId);

    List<PromotionProduct> findByProductId(Long productId);

    boolean existsByPromotionId(Long promotionId);

    boolean existsByPromotionIdAndProductId(Long promotionId, Long productId);

    void deleteByPromotionId(Long promotionId);
}
