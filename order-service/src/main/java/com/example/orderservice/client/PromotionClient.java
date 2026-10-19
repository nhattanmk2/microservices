package com.example.orderservice.client;

import com.example.orderservice.dto.*;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "promotion-service")
public interface PromotionClient {

    @PostMapping("/api/promotions/apply")
    ApplyPromotionResponse applyPromotion(@RequestBody ApplyPromotionRequest request,
                                          @RequestHeader(value = "X-Auth-Username", required = false) String username);

    @PostMapping("/api/promotions/consume")
    ConsumePromotionResponse consumePromotion(@RequestBody ConsumePromotionRequest request,
                                              @RequestHeader(value = "X-Auth-Username", required = false) String username);

    @PostMapping("/api/promotions/refund")
    RefundPromotionResponse refundPromotion(@RequestBody RefundPromotionRequest request,
                                            @RequestHeader(value = "X-Auth-Username", required = false) String username);
}
