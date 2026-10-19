package com.example.promotionservice.repository;

import com.example.promotionservice.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    Optional<Promotion> findByCodeIgnoreCase(String code);

    List<Promotion> findByIsActiveTrueAndStartDateBeforeAndEndDateAfter(LocalDateTime startCheck, LocalDateTime endCheck);

    @Modifying
    @Query("UPDATE Promotion p SET p.usedCount = p.usedCount + 1 WHERE p.id = :id AND p.usedCount < p.usageLimit AND p.isActive = true")
    int incrementUsedCount(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Promotion p SET p.usedCount = p.usedCount - 1 WHERE p.id = :id AND p.usedCount > 0")
    int decrementUsedCount(@Param("id") Long id);
}
