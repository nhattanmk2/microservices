package com.example.promotionservice.repository;

import com.example.promotionservice.entity.PromotionUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PromotionUsageRepository extends JpaRepository<PromotionUsage, Long> {

    long countByPromotionIdAndBuyerUsernameAndStatus(Long promotionId, String buyerUsername, String status);

    Optional<PromotionUsage> findByOrderIdAndPromotionCodeAndStatus(Long orderId, String promotionCode, String status);

    List<PromotionUsage> findByBuyerUsername(String buyerUsername);

    List<PromotionUsage> findByPromotionId(Long promotionId);
}
