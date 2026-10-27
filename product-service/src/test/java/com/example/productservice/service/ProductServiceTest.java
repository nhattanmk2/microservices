package com.example.productservice.service;

import com.example.productservice.client.AuthClient;
import com.example.productservice.dto.ProductDTO;
import com.example.productservice.entity.Product;
import com.example.productservice.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private AuthClient authClient;

    @InjectMocks
    private ProductService productService;

    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        sampleProduct = Product.builder()
                .id(1L)
                .name("Laptop Dell")
                .price(new BigDecimal("1500.00"))
                .description("Dell XPS 15")
                .stock(50)
                .build();
    }

    @Test
    void getAllProducts_ReturnsDTOs() {
        when(productRepository.findAll()).thenReturn(Collections.singletonList(sampleProduct));

        List<ProductDTO> result = productService.getAllProducts();

        assertEquals(1, result.size());
        assertEquals("Laptop Dell", result.get(0).getName());
        verify(productRepository, times(1)).findAll();
    }

    @Test
    void createProduct_SetsDefaultStock() {
        ProductDTO inputDto = new ProductDTO(null, "Chuột không dây", new BigDecimal("50.00"), "Chuột Logitech");
        Product savedProduct = Product.builder()
                .id(2L)
                .name("Chuột không dây")
                .price(new BigDecimal("50.00"))
                .description("Chuột Logitech")
                .stock(100)
                .build();

        when(productRepository.save(any(Product.class))).thenReturn(savedProduct);

        ProductDTO result = productService.createProduct(inputDto);

        assertNotNull(result.getId());
        assertEquals(2L, result.getId());
        assertEquals("Chuột không dây", result.getName());
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    void checkAuthStatus_Success() {
        when(authClient.getAuthStatus()).thenReturn("Auth Service is healthy");

        String result = productService.checkAuthStatus();

        assertEquals("Phản hồi từ Auth Service (thông qua Feign): Auth Service is healthy", result);
        verify(authClient, times(1)).getAuthStatus();
    }

    @Test
    void checkAuthStatus_Fail() {
        when(authClient.getAuthStatus()).thenThrow(new RuntimeException("Connection Refused"));

        String result = productService.checkAuthStatus();

        assertEquals("Lỗi! Không thể kết nối tới Auth Service. Chi tiết: Connection Refused", result);
        verify(authClient, times(1)).getAuthStatus();
    }
}
