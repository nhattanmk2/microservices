package com.example.orderservice.client;

import com.example.orderservice.dto.ProductDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "product-service")
public interface ProductClient {
    @GetMapping("/api/products/{id}")
    ProductDto getProductById(@PathVariable("id") Long id);

    @PutMapping("/api/products/{id}/reduce-stock")
    ProductDto reduceStock(@PathVariable("id") Long id, @RequestParam("quantity") int quantity);

    @PutMapping("/api/products/{id}/restore-stock")
    ProductDto restoreStock(@PathVariable("id") Long id, @RequestParam("quantity") int quantity);
}
