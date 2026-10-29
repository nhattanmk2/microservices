package com.example.productservice.service;

import com.example.productservice.dto.ProductDTO;
import com.example.productservice.entity.Product;
import com.example.productservice.repository.ProductRepository;
import com.example.productservice.client.AuthClient;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class ProductService {

    private final ProductRepository productRepository;
    private final AuthClient authClient;
    private final org.springframework.web.client.RestTemplate restTemplate;

    public ProductService(ProductRepository productRepository, AuthClient authClient,
                          org.springframework.web.client.RestTemplate restTemplate) {
        this.productRepository = productRepository;
        this.authClient = authClient;
        this.restTemplate = restTemplate;
    }

    public String checkAuthStatus() {
        try {
            String response = authClient.getAuthStatus();
            return "Phản hồi từ Auth Service (thông qua Feign): " + response;
        } catch (Exception e) {
            return "Lỗi! Không thể kết nối tới Auth Service. Chi tiết: " + e.getMessage();
        }
    }

    public String fetchExternalData() {
        try {
            String url = "https://jsonplaceholder.typicode.com/todos/1";
            return restTemplate.getForObject(url, String.class);
        } catch (Exception e) {
            return "Lỗi khi gọi external server: " + e.getMessage();
        }
    }

    @Cacheable(value = "products", key = "'all'")
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "product", key = "#id")
    public Optional<ProductDTO> getProductById(Long id) {
        return productRepository.findById(id).map(this::mapToDTO);
    }

    @CacheEvict(value = "products", allEntries = true)
    public ProductDTO createProduct(ProductDTO dto) {
        Product product = Product.builder()
                .name(dto.getName())
                .price(dto.getPrice())
                .description(dto.getDescription())
                .stock(100)
                .build();
        Product saved = productRepository.save(product);
        return mapToDTO(saved);
    }

    private ProductDTO mapToDTO(Product product) {
        return new ProductDTO(
                product.getId(),
                product.getName(),
                product.getPrice(),
                product.getDescription()
        );
    }
}

