package com.example.promotionservice.service;

import com.example.promotionservice.dto.*;
import com.example.promotionservice.entity.DiscountType;
import com.example.promotionservice.entity.Promotion;
import com.example.promotionservice.entity.PromotionProduct;
import com.example.promotionservice.entity.PromotionUsage;
import com.example.promotionservice.exception.PromotionException;
import com.example.promotionservice.repository.PromotionProductRepository;
import com.example.promotionservice.repository.PromotionRepository;
import com.example.promotionservice.repository.PromotionUsageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final PromotionProductRepository promotionProductRepository;
    private final PromotionUsageRepository promotionUsageRepository;

    public PromotionService(PromotionRepository promotionRepository,
                            PromotionProductRepository promotionProductRepository,
                            PromotionUsageRepository promotionUsageRepository) {
        this.promotionRepository = promotionRepository;
        this.promotionProductRepository = promotionProductRepository;
        this.promotionUsageRepository = promotionUsageRepository;
    }

    public ApplyPromotionResponse applyPromotion(ApplyPromotionRequest request) {
        if (request == null || !StringUtils.hasText(request.getPromotionCode())) {
            throw new PromotionException("Ma khuyen mai khong duoc de trong");
        }

        Promotion promotion = promotionRepository.findByCodeIgnoreCase(request.getPromotionCode().trim())
                .orElseThrow(() -> new PromotionException("Khong tim thay ma khuyen mai: " + request.getPromotionCode()));

        validateEligibility(promotion, request.getBuyerUsername(), request.getOrderTotal());

        BigDecimal applicableAmount = calculateBaseAmount(promotion, request);
        BigDecimal discountAmount = calculateDiscount(promotion, applicableAmount, request.getOrderTotal());
        BigDecimal finalTotal = request.getOrderTotal().subtract(discountAmount);
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            finalTotal = BigDecimal.ZERO;
        }

        return ApplyPromotionResponse.builder()
                .valid(true)
                .promotionCode(promotion.getCode())
                .discountType(promotion.getDiscountType())
                .discountValue(promotion.getDiscountValue())
                .discountAmount(discountAmount)
                .finalTotal(finalTotal)
                .message("Ap dung ma giam gia thanh cong")
                .build();
    }

    @Transactional
    public ConsumePromotionResponse consumePromotion(ConsumePromotionRequest request) {
        if (request == null || !StringUtils.hasText(request.getPromotionCode())) {
            throw new PromotionException("Thong tin ghi nhan su dung voucher khong hop le");
        }

        Promotion promotion = promotionRepository.findByCodeIgnoreCase(request.getPromotionCode().trim())
                .orElseThrow(() -> new PromotionException("Khong tim thay ma khuyen mai: " + request.getPromotionCode()));

        int updated = promotionRepository.incrementUsedCount(promotion.getId());
        if (updated == 0) {
            throw new PromotionException("Ma khuyen mai da het luot su dung tren toan he thong hoac bi vo hieu hoa");
        }

        PromotionUsage usage = PromotionUsage.builder()
                .promotionId(promotion.getId())
                .promotionCode(promotion.getCode())
                .buyerUsername(request.getBuyerUsername() != null ? request.getBuyerUsername() : "anonymous")
                .orderId(request.getOrderId())
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .status("USED")
                .usedAt(LocalDateTime.now())
                .build();

        PromotionUsage saved = promotionUsageRepository.save(usage);
        return ConsumePromotionResponse.builder()
                .success(true)
                .message("Ghi nhan su dung voucher thanh cong")
                .usageId(saved.getId())
                .build();
    }

    @Transactional
    public RefundPromotionResponse refundPromotion(RefundPromotionRequest request) {
        if (request == null || request.getOrderId() == null || !StringUtils.hasText(request.getPromotionCode())) {
            throw new PromotionException("Thong tin hoan voucher khong hop le");
        }

        PromotionUsage usage = promotionUsageRepository.findByOrderAndCode(
                request.getOrderId(), request.getPromotionCode().trim().toUpperCase(), "USED")
                .orElseThrow(() -> new PromotionException("Khong tim thay luot su dung voucher hop le de hoan lai"));

        usage.setStatus("REFUNDED");
        usage.setRefundedAt(LocalDateTime.now());
        promotionUsageRepository.save(usage);

        promotionRepository.decrementUsedCount(usage.getPromotionId());

        return RefundPromotionResponse.builder()
                .success(true)
                .message("Hoan lai luot su dung voucher thanh cong")
                .build();
    }

    @Transactional
    public PromotionResponseDto createPromotion(CreatePromotionRequest request, String role) {
        verifyAdminRole(role);

        if (request == null || !StringUtils.hasText(request.getCode()) || !StringUtils.hasText(request.getName())) {
            throw new PromotionException("Ma va ten chuong trinh khuyen mai la bat buoc");
        }

        String normalizedCode = request.getCode().trim().toUpperCase();
        if (promotionRepository.findByCodeIgnoreCase(normalizedCode).isPresent()) {
            throw new PromotionException("Ma khuyen mai da ton tai: " + normalizedCode);
        }

        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new PromotionException("Ngay bat dau va ket thuc la bat buoc");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new PromotionException("Ngay ket thuc khong duoc truoc ngay bat dau");
        }

        Promotion promotion = Promotion.builder()
                .code(normalizedCode)
                .name(request.getName())
                .description(request.getDescription())
                .discountType(request.getDiscountType() != null ? request.getDiscountType() : DiscountType.PERCENTAGE)
                .discountValue(request.getDiscountValue() != null ? request.getDiscountValue() : BigDecimal.ZERO)
                .minOrderValue(request.getMinOrderValue())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .usageLimit(request.getUsageLimit() != null ? request.getUsageLimit() : 100)
                .usedCount(0)
                .limitPerUser(request.getLimitPerUser() != null ? request.getLimitPerUser() : 1)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isActive(true)
                .build();

        Promotion saved = promotionRepository.save(promotion);

        List<Long> productIds = new ArrayList<>();
        if (request.getApplicableProductIds() != null && !request.getApplicableProductIds().isEmpty()) {
            for (Long pid : request.getApplicableProductIds()) {
                PromotionProduct pp = PromotionProduct.builder()
                        .promotionId(saved.getId())
                        .productId(pid)
                        .build();
                promotionProductRepository.save(pp);
                productIds.add(pid);
            }
        }

        return mapToDto(saved, productIds);
    }

    @Transactional
    public PromotionResponseDto togglePromotionStatus(Long id, boolean active, String role) {
        verifyAdminRole(role);

        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new PromotionException("Khong tim thay chuong trinh khuyen mai voi ID: " + id));

        promotion.setIsActive(active);
        Promotion updated = promotionRepository.save(promotion);

        List<Long> productIds = promotionProductRepository.findByPromotionId(updated.getId())
                .stream().map(PromotionProduct::getProductId).collect(Collectors.toList());

        return mapToDto(updated, productIds);
    }

    public List<PromotionResponseDto> getActivePromotions() {
        LocalDateTime now = LocalDateTime.now();
        List<Promotion> promotions = promotionRepository.findActive(now, now);
        return promotions.stream().map(p -> {
            List<Long> productIds = promotionProductRepository.findByPromotionId(p.getId())
                    .stream().map(PromotionProduct::getProductId).collect(Collectors.toList());
            return mapToDto(p, productIds);
        }).collect(Collectors.toList());
    }

    public PromotionResponseDto getPromotionByCode(String code) {
        if (!StringUtils.hasText(code)) {
            throw new PromotionException("Ma khuyen mai khong hop le");
        }
        Promotion promotion = promotionRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new PromotionException("Khong tim thay ma khuyen mai: " + code));

        List<Long> productIds = promotionProductRepository.findByPromotionId(promotion.getId())
                .stream().map(PromotionProduct::getProductId).collect(Collectors.toList());

        return mapToDto(promotion, productIds);
    }

    public List<PromotionResponseDto> getForProduct(Long productId) {
        LocalDateTime now = LocalDateTime.now();
        List<Promotion> activePromos = promotionRepository.findActive(now, now);

        List<PromotionResponseDto> result = new ArrayList<>();
        for (Promotion promo : activePromos) {
            boolean hasProductRestrictions = promotionProductRepository.existsByPromotionId(promo.getId());
            if (!hasProductRestrictions || promotionProductRepository.existsByProduct(promo.getId(), productId)) {
                List<Long> pids = promotionProductRepository.findByPromotionId(promo.getId())
                        .stream().map(PromotionProduct::getProductId).collect(Collectors.toList());
                result.add(mapToDto(promo, pids));
            }
        }
        return result;
    }

    private void validateEligibility(Promotion promotion, String username, BigDecimal orderTotal) {
        if (!Boolean.TRUE.equals(promotion.getIsActive())) {
            throw new PromotionException("Ma khuyen mai hien khong hoat dong");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(promotion.getStartDate())) {
            throw new PromotionException("Chuong trinh khuyen mai chua bat dau");
        }
        if (now.isAfter(promotion.getEndDate())) {
            throw new PromotionException("Chuong trinh khuyen mai da het han");
        }

        if (promotion.getUsedCount() >= promotion.getUsageLimit()) {
            throw new PromotionException("Ma khuyen mai da het luot su dung tren toan he thong");
        }

        if (StringUtils.hasText(username)) {
            long usedCountByUser = promotionUsageRepository.countUsage(
                    promotion.getId(), username, "USED");
            if (usedCountByUser >= promotion.getLimitPerUser()) {
                throw new PromotionException(String.format("Ban da su dung het gioi han (%d lan) cho ma khuyen mai nay",
                        promotion.getLimitPerUser()));
            }
        }

        if (promotion.getMinOrderValue() != null && orderTotal != null) {
            if (orderTotal.compareTo(promotion.getMinOrderValue()) < 0) {
                throw new PromotionException(String.format("Gia tri don hang phai dat toi thieu %s de ap dung ma nay",
                        promotion.getMinOrderValue()));
            }
        }
    }

    private BigDecimal calculateBaseAmount(Promotion promotion, ApplyPromotionRequest request) {
        boolean hasRestrictions = promotionProductRepository.existsByPromotionId(promotion.getId());
        if (!hasRestrictions) {
            return request.getOrderTotal() != null ? request.getOrderTotal() : BigDecimal.ZERO;
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new PromotionException("Ma khuyen mai nay chi ap dung cho cac san pham cu the");
        }

        BigDecimal eligibleTotal = BigDecimal.ZERO;
        for (OrderItemDto item : request.getItems()) {
            if (item.getProductId() != null &&
                    promotionProductRepository.existsByProduct(promotion.getId(), item.getProductId())) {
                BigDecimal itemTotal = item.getUnitPrice() != null && item.getQuantity() != null
                        ? item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                        : BigDecimal.ZERO;
                eligibleTotal = eligibleTotal.add(itemTotal);
            }
        }

        if (eligibleTotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new PromotionException("Khong co san pham nao trong don hang du dieu kien ap dung ma khuyen mai nay");
        }

        return eligibleTotal;
    }

    private BigDecimal calculateDiscount(Promotion promotion, BigDecimal applicableAmount, BigDecimal orderTotal) {
        BigDecimal discount;
        if (promotion.getDiscountType() == DiscountType.PERCENTAGE) {
            discount = applicableAmount.multiply(promotion.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (promotion.getMaxDiscountAmount() != null && discount.compareTo(promotion.getMaxDiscountAmount()) > 0) {
                discount = promotion.getMaxDiscountAmount();
            }
        } else {
            discount = promotion.getDiscountValue();
        }

        if (orderTotal != null && discount.compareTo(orderTotal) > 0) {
            discount = orderTotal;
        }

        return discount;
    }

    private void verifyAdminRole(String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new PromotionException(HttpStatus.FORBIDDEN, "Yeu cau quyen ADMIN de thuc hien thao tac nay");
        }
    }

    private PromotionResponseDto mapToDto(Promotion p, List<Long> productIds) {
        int remaining = Math.max(0, p.getUsageLimit() - p.getUsedCount());
        return PromotionResponseDto.builder()
                .id(p.getId())
                .code(p.getCode())
                .name(p.getName())
                .description(p.getDescription())
                .discountType(p.getDiscountType())
                .discountValue(p.getDiscountValue())
                .minOrderValue(p.getMinOrderValue())
                .maxDiscountAmount(p.getMaxDiscountAmount())
                .usageLimit(p.getUsageLimit())
                .usedCount(p.getUsedCount())
                .remainingUsage(remaining)
                .limitPerUser(p.getLimitPerUser())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .isActive(p.getIsActive())
                .applicableProductIds(productIds)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
