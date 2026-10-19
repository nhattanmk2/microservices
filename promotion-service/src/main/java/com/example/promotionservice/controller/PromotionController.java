package com.example.promotionservice.controller;

import com.example.promotionservice.dto.*;
import com.example.promotionservice.service.PromotionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    private final PromotionService promotionService;

    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    @GetMapping
    public ResponseEntity<List<PromotionResponseDto>> getActivePromotions() {
        return ResponseEntity.ok(promotionService.getActivePromotions());
    }

    @GetMapping("/{code}")
    public ResponseEntity<PromotionResponseDto> getPromotionByCode(@PathVariable("code") String code) {
        return ResponseEntity.ok(promotionService.getPromotionByCode(code));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<PromotionResponseDto>> getPromotionsForProduct(@PathVariable("productId") Long productId) {
        return ResponseEntity.ok(promotionService.getPromotionsForProduct(productId));
    }

    @PostMapping("/apply")
    public ResponseEntity<ApplyPromotionResponse> applyPromotion(@RequestBody ApplyPromotionRequest request,
                                                                 @RequestHeader(value = "X-Auth-Username", required = false) String authUsername) {
        if (request.getBuyerUsername() == null && authUsername != null) {
            request.setBuyerUsername(authUsername);
        }
        return ResponseEntity.ok(promotionService.applyPromotion(request));
    }

    @PostMapping("/consume")
    public ResponseEntity<ConsumePromotionResponse> consumePromotion(@RequestBody ConsumePromotionRequest request,
                                                                     @RequestHeader(value = "X-Auth-Username", required = false) String authUsername) {
        if (request.getBuyerUsername() == null && authUsername != null) {
            request.setBuyerUsername(authUsername);
        }
        return ResponseEntity.ok(promotionService.consumePromotion(request));
    }

    @PostMapping("/refund")
    public ResponseEntity<RefundPromotionResponse> refundPromotion(@RequestBody RefundPromotionRequest request,
                                                                   @RequestHeader(value = "X-Auth-Username", required = false) String authUsername) {
        if (request.getBuyerUsername() == null && authUsername != null) {
            request.setBuyerUsername(authUsername);
        }
        return ResponseEntity.ok(promotionService.refundPromotion(request));
    }

    @PostMapping
    public ResponseEntity<PromotionResponseDto> createPromotion(@RequestBody CreatePromotionRequest request,
                                                                @RequestHeader(value = "X-Auth-Role", required = false) String role) {
        return new ResponseEntity<>(promotionService.createPromotion(request, role), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PromotionResponseDto> toggleStatus(@PathVariable("id") Long id,
                                                             @RequestParam("active") boolean active,
                                                             @RequestHeader(value = "X-Auth-Role", required = false) String role) {
        return ResponseEntity.ok(promotionService.togglePromotionStatus(id, active, role));
    }
}
