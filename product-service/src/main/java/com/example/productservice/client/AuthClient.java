package com.example.productservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "auth-service") // Auto resolves using Eureka
public interface AuthClient {

    @GetMapping("/api/auth/status")
    String getAuthStatus();
}
