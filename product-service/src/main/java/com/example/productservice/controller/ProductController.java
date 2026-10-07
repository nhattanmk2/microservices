package com.example.productservice.controller;

import com.example.productservice.dto.ProductDTO;
import com.example.productservice.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/check-auth")
    public ResponseEntity<String> checkAuth() {
        String result = productService.checkAuthServiceStatus();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/external-demo")
    public ResponseEntity<String> testExternalCall() {
        // Dùng RestTemplate gọi ra ngoài Internet
        return ResponseEntity.ok(productService.fetchExternalData());
    }

    @GetMapping
    public ResponseEntity<List<ProductDTO>> getProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        ProductDTO productDTO = productService.getProductById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Sản phẩm với ID " + id + " không tồn tại!"));
        return ResponseEntity.ok(productDTO);
    }

    @PostMapping
    public ResponseEntity<ProductDTO> addProduct(@RequestBody ProductDTO productDTO) {
        ProductDTO created = productService.createProduct(productDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}


