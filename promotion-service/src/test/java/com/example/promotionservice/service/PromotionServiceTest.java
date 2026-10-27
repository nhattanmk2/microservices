package com.example.promotionservice.service;

import com.example.promotionservice.dto.*;
import com.example.promotionservice.entity.DiscountType;
import com.example.promotionservice.entity.Promotion;
import com.example.promotionservice.entity.PromotionUsage;
import com.example.promotionservice.exception.PromotionException;
import com.example.promotionservice.repository.PromotionProductRepository;
import com.example.promotionservice.repository.PromotionRepository;
import com.example.promotionservice.repository.PromotionUsageRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class PromotionServiceTest {

    @Mock
    private PromotionRepository promotionRepository;

    @Mock
    private PromotionProductRepository promotionProductRepository;

    @Mock
    private PromotionUsageRepository promotionUsageRepository;

    @InjectMocks
    private PromotionService promotionService;

    @Test
    @DisplayName("Áp dụng mã giảm giá theo phần trăm thành công (có giới hạn trần)")
    void apply_Percentage_Success() {
        // Given
        Promotion promo = Promotion.builder()
                .id(1L)
                .code("SALE20")
                .name("Giam 20%")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(20.0))
                .minOrderValue(BigDecimal.valueOf(100000.0))
                .maxDiscountAmount(BigDecimal.valueOf(50000.0))
                .usageLimit(100)
                .usedCount(10)
                .limitPerUser(1)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(5))
                .isActive(true)
                .build();

        when(promotionRepository.findByCodeIgnoreCase("SALE20")).thenReturn(Optional.of(promo));
        when(promotionUsageRepository.countUsage(1L, "john", "USED")).thenReturn(0L);
        when(promotionProductRepository.existsByPromotionId(1L)).thenReturn(false);

        ApplyPromotionRequest request = ApplyPromotionRequest.builder()
                .promotionCode("SALE20")
                .buyerUsername("john")
                .orderTotal(BigDecimal.valueOf(500000.0))
                .build();

        // When (500k * 20% = 100k, nhung maxDiscount la 50k -> giam 50k)
        ApplyPromotionResponse response = promotionService.applyPromotion(request);

        // Then
        assertTrue(response.isValid());
        assertEquals("SALE20", response.getPromotionCode());
        assertEquals(BigDecimal.valueOf(50000.0), response.getDiscountAmount());
        assertEquals(BigDecimal.valueOf(450000.0), response.getFinalTotal());
    }

    @Test
    @DisplayName("Áp dụng mã giảm giá tiền mặt cố định thành công")
    void apply_FixedAmount_Success() {
        // Given
        Promotion promo = Promotion.builder()
                .id(2L)
                .code("GIAM30K")
                .name("Giam 30K truc tiep")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(30000.0))
                .minOrderValue(BigDecimal.valueOf(100000.0))
                .usageLimit(50)
                .usedCount(5)
                .limitPerUser(2)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .isActive(true)
                .build();

        when(promotionRepository.findByCodeIgnoreCase("GIAM30K")).thenReturn(Optional.of(promo));
        when(promotionUsageRepository.countUsage(2L, "alice", "USED")).thenReturn(1L);
        when(promotionProductRepository.existsByPromotionId(2L)).thenReturn(false);

        ApplyPromotionRequest request = ApplyPromotionRequest.builder()
                .promotionCode("GIAM30K")
                .buyerUsername("alice")
                .orderTotal(BigDecimal.valueOf(200000.0))
                .build();

        // When
        ApplyPromotionResponse response = promotionService.applyPromotion(request);

        // Then
        assertTrue(response.isValid());
        assertEquals(BigDecimal.valueOf(30000.0), response.getDiscountAmount());
        assertEquals(BigDecimal.valueOf(170000.0), response.getFinalTotal());
    }

    @Test
    @DisplayName("Báo lỗi khi mã khuyến mãi đã hết hạn")
    void apply_Expired_Throws() {
        // Given
        Promotion expiredPromo = Promotion.builder()
                .id(3L)
                .code("EXPIRED")
                .startDate(LocalDateTime.now().minusDays(10))
                .endDate(LocalDateTime.now().minusDays(1))
                .isActive(true)
                .build();

        when(promotionRepository.findByCodeIgnoreCase("EXPIRED")).thenReturn(Optional.of(expiredPromo));

        ApplyPromotionRequest request = ApplyPromotionRequest.builder()
                .promotionCode("EXPIRED")
                .buyerUsername("john")
                .orderTotal(BigDecimal.valueOf(200000.0))
                .build();

        // When & Then
        PromotionException ex = assertThrows(PromotionException.class, () -> promotionService.applyPromotion(request));
        assertTrue(ex.getMessage().contains("da het han"));
    }

    @Test
    @DisplayName("Báo lỗi khi đơn hàng chưa đạt giá trị tối thiểu")
    void apply_MinOrderNotMet_Throws() {
        // Given
        Promotion promo = Promotion.builder()
                .id(4L)
                .code("MIN500K")
                .minOrderValue(BigDecimal.valueOf(500000.0))
                .usageLimit(100)
                .usedCount(0)
                .limitPerUser(1)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(5))
                .isActive(true)
                .build();

        when(promotionRepository.findByCodeIgnoreCase("MIN500K")).thenReturn(Optional.of(promo));

        ApplyPromotionRequest request = ApplyPromotionRequest.builder()
                .promotionCode("MIN500K")
                .buyerUsername("john")
                .orderTotal(BigDecimal.valueOf(300000.0))
                .build();

        // When & Then
        PromotionException ex = assertThrows(PromotionException.class, () -> promotionService.applyPromotion(request));
        assertTrue(ex.getMessage().contains("Gia tri don hang phai dat toi thieu"));
    }

    @Test
    @DisplayName("Báo lỗi khi user đã sử dụng hết số lần cho phép")
    void apply_UserLimitExceeded_Throws() {
        // Given
        Promotion promo = Promotion.builder()
                .id(5L)
                .code("ONCE_ONLY")
                .usageLimit(100)
                .usedCount(5)
                .limitPerUser(1)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(5))
                .isActive(true)
                .build();

        when(promotionRepository.findByCodeIgnoreCase("ONCE_ONLY")).thenReturn(Optional.of(promo));
        when(promotionUsageRepository.countUsage(5L, "spammer", "USED")).thenReturn(1L);

        ApplyPromotionRequest request = ApplyPromotionRequest.builder()
                .promotionCode("ONCE_ONLY")
                .buyerUsername("spammer")
                .orderTotal(BigDecimal.valueOf(100000.0))
                .build();

        // When & Then
        PromotionException ex = assertThrows(PromotionException.class, () -> promotionService.applyPromotion(request));
        assertTrue(ex.getMessage().contains("Ban da su dung het gioi han"));
    }

    @Test
    @DisplayName("Áp dụng thành công cho sản phẩm chỉ định cụ thể")
    void apply_SpecificProducts_Success() {
        // Given
        Promotion promo = Promotion.builder()
                .id(6L)
                .code("PROD1_ONLY")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10.0))
                .usageLimit(100)
                .usedCount(0)
                .limitPerUser(1)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(5))
                .isActive(true)
                .build();

        when(promotionRepository.findByCodeIgnoreCase("PROD1_ONLY")).thenReturn(Optional.of(promo));
        when(promotionProductRepository.existsByPromotionId(6L)).thenReturn(true);
        when(promotionProductRepository.existsByProduct(6L, 100L)).thenReturn(true);
        when(promotionProductRepository.existsByProduct(6L, 200L)).thenReturn(false);

        List<OrderItemDto> items = List.of(
                new OrderItemDto(100L, 2, BigDecimal.valueOf(50000.0)), // 100k (duoc giam 10% = 10k)
                new OrderItemDto(200L, 1, BigDecimal.valueOf(100000.0)) // 100k (khong duoc giam)
        );

        ApplyPromotionRequest request = ApplyPromotionRequest.builder()
                .promotionCode("PROD1_ONLY")
                .buyerUsername("buyer")
                .orderTotal(BigDecimal.valueOf(200000.0))
                .items(items)
                .build();

        // When
        ApplyPromotionResponse response = promotionService.applyPromotion(request);

        // Then
        assertTrue(response.isValid());
        assertEquals(BigDecimal.valueOf(10000.0).setScale(2), response.getDiscountAmount());
        assertEquals(BigDecimal.valueOf(190000.0).setScale(2), response.getFinalTotal());
    }

    @Test
    @DisplayName("Ghi nhận lượt sử dụng (consume) voucher thành công")
    void consume_Success() {
        // Given
        Promotion promo = Promotion.builder().id(10L).code("CONSUME_ME").usageLimit(10).usedCount(0).build();
        when(promotionRepository.findByCodeIgnoreCase("CONSUME_ME")).thenReturn(Optional.of(promo));
        when(promotionRepository.incrementUsedCount(10L)).thenReturn(1);

        PromotionUsage savedUsage = PromotionUsage.builder().id(999L).build();
        when(promotionUsageRepository.save(any(PromotionUsage.class))).thenReturn(savedUsage);

        ConsumePromotionRequest request = ConsumePromotionRequest.builder()
                .promotionCode("CONSUME_ME")
                .buyerUsername("john")
                .orderId(1234L)
                .discountAmount(BigDecimal.valueOf(25000.0))
                .build();

        // When
        ConsumePromotionResponse response = promotionService.consumePromotion(request);

        // Then
        assertTrue(response.isSuccess());
        assertEquals(999L, response.getUsageId());
        verify(promotionRepository, times(1)).incrementUsedCount(10L);
        verify(promotionUsageRepository, times(1)).save(any(PromotionUsage.class));
    }

    @Test
    @DisplayName("Hoàn lại lượt sử dụng (refund) voucher thành công khi hủy đơn")
    void refund_Success() {
        // Given
        PromotionUsage usage = PromotionUsage.builder()
                .id(888L)
                .promotionId(10L)
                .promotionCode("REFUND_ME")
                .orderId(1234L)
                .status("USED")
                .build();

        when(promotionUsageRepository.findByOrderAndCode(1234L, "REFUND_ME", "USED"))
                .thenReturn(Optional.of(usage));
        when(promotionUsageRepository.save(any(PromotionUsage.class))).thenReturn(usage);
        when(promotionRepository.decrementUsedCount(10L)).thenReturn(1);

        RefundPromotionRequest request = RefundPromotionRequest.builder()
                .promotionCode("REFUND_ME")
                .orderId(1234L)
                .reason("Khach hang huy don")
                .build();

        // When
        RefundPromotionResponse response = promotionService.refundPromotion(request);

        // Then
        assertTrue(response.isSuccess());
        assertEquals("REFUNDED", usage.getStatus());
        assertNotNull(usage.getRefundedAt());
        verify(promotionRepository, times(1)).decrementUsedCount(10L);
    }

    @Test
    @DisplayName("Tạo mới chương trình khuyến mãi thành công với quyền ADMIN")
    void create_AdminRole_Success() {
        // Given
        CreatePromotionRequest request = CreatePromotionRequest.builder()
                .code("NEWYEAR")
                .name("Chao nam moi")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(15.0))
                .usageLimit(200)
                .limitPerUser(1)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(10))
                .applicableProductIds(Collections.singletonList(55L))
                .build();

        when(promotionRepository.findByCodeIgnoreCase("NEWYEAR")).thenReturn(Optional.empty());
        when(promotionRepository.save(any(Promotion.class))).thenAnswer(inv -> {
            Promotion p = inv.getArgument(0);
            p.setId(100L);
            return p;
        });

        // When
        PromotionResponseDto result = promotionService.createPromotion(request, "ADMIN");

        // Then
        assertNotNull(result);
        assertEquals("NEWYEAR", result.getCode());
        assertEquals(100L, result.getId());
        verify(promotionProductRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Từ chối tạo khuyến mãi khi không có quyền ADMIN (Forbidden)")
    void create_NonAdmin_ThrowsForbidden() {
        CreatePromotionRequest request = CreatePromotionRequest.builder().code("TEST").name("Test").build();

        PromotionException ex = assertThrows(PromotionException.class, () -> promotionService.createPromotion(request, "USER"));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }
}
