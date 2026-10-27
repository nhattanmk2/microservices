package com.example.promotionservice.repository;

import com.example.promotionservice.entity.PromotionUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PromotionUsageRepository extends JpaRepository<PromotionUsage, Long> {

    @Query("SELECT COUNT(u) FROM PromotionUsage u WHERE u.promotionId = :promotionId AND u.buyerUsername = :buyerUsername AND u.status = :status")
    long countUsage(@Param("promotionId") Long promotionId, @Param("buyerUsername") String buyerUsername, @Param("status") String status);

    @Query("SELECT u FROM PromotionUsage u WHERE u.orderId = :orderId AND u.promotionCode = :promotionCode AND u.status = :status")
    Optional<PromotionUsage> findByOrderAndCode(@Param("orderId") Long orderId, @Param("promotionCode") String promotionCode, @Param("status") String status);

    List<PromotionUsage> findByBuyerUsername(String buyerUsername);

    List<PromotionUsage> findByPromotionId(Long promotionId);
}
