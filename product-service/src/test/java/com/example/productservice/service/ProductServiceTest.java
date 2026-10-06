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
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class) // Báo cho JUnit biết chúng ta dùng Mockito
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository; // Làm giả Database

    @Mock
    private AuthClient authClient; // Làm giả Feign Client kết nối tới Auth-Service

    @InjectMocks
    private ProductService productService; // Service thật cần test, tự động được bơm 2 cái Mock ở trên vào

    private Product sampleProduct;

    // Hàm này chạy TRƯỚC mỗi bài test, dùng để tạo dữ liệu mẫu
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

    // --------------------------------------------------------
    // BÀI TEST 1: Kiểm tra lấy danh sách
    // --------------------------------------------------------
    @Test
    void getAllProducts_ShouldReturnListOfDTOs() {
        // 1. Giả lập (Mocking): Dặn DB giả rằng "hễ ai gọi findAll() thì mày trả về 1 cái List có 1 sản phẩm mẫu nhé"
        when(productRepository.findAll()).thenReturn(Arrays.asList(sampleProduct));

        // 2. Thực thi (Execution): Gọi hàm thật của Service
        List<ProductDTO> result = productService.getAllProducts();

        // 3. Kiểm chứng (Assertion): Xem hàm thật có chạy đúng ý mình không
        assertEquals(1, result.size());
        assertEquals("Laptop Dell", result.get(0).getName());
        
        // Kiểm tra xem Service có thật sự gọi lệnh findAll() xuống DB không
        verify(productRepository, times(1)).findAll();
    }

    // --------------------------------------------------------
    // BÀI TEST 2: Kiểm tra tạo mới và tính toán logic stock
    // --------------------------------------------------------
    @Test
    void createProduct_ShouldSetDefaultStockAndReturnDTO() {
        // Chuẩn bị DTO đầu vào (không có trường stock)
        ProductDTO inputDto = new ProductDTO(null, "Chuột không dây", new BigDecimal("50.00"), "Chuột Logitech");
        
        // Đối tượng mong đợi sẽ được lưu xuống DB (Có stock = 100)
        Product savedProduct = Product.builder()
                .id(2L) // Cấp ID giả định
                .name("Chuột không dây")
                .price(new BigDecimal("50.00"))
                .description("Chuột Logitech")
                .stock(100)
                .build();

        // 1. Giả lập DB: hễ ai gọi save() với bất kỳ Product nào, thì trả về savedProduct
        when(productRepository.save(any(Product.class))).thenReturn(savedProduct);

        // 2. Thực thi
        ProductDTO result = productService.createProduct(inputDto);

        // 3. Kiểm chứng
        assertNotNull(result.getId());
        assertEquals(2L, result.getId());
        assertEquals("Chuột không dây", result.getName());
    }

    // --------------------------------------------------------
    // BÀI TEST 3: Kiểm tra cấu trúc rẽ nhánh try/catch
    // --------------------------------------------------------
    @Test
    void checkAuthServiceStatus_Success_ShouldReturnString() {
        // 1. Giả lập gọi API qua Feign thành công
        when(authClient.getAuthStatus()).thenReturn("Auth Service is healthy");

        // 2. Thực thi
        String result = productService.checkAuthServiceStatus();

        // 3. Kiểm chứng
        assertEquals("Phản hồi từ Auth Service (thông qua Feign): Auth Service is healthy", result);
    }

    @Test
    void checkAuthServiceStatus_Fail_ShouldReturnErrorMessage() {
        // 1. Giả lập Auth-Service bị sập (ném lỗi RuntimeException khi gọi Feign)
        when(authClient.getAuthStatus()).thenThrow(new RuntimeException("Connection Refused"));

        // 2. Thực thi
        String result = productService.checkAuthServiceStatus();

        // 3. Kiểm chứng xem Service có bắt lỗi bằng Catch và bọc lại đúng không
        assertEquals("Lỗi! Không thể kết nối tới Auth Service. Chi tiết: Connection Refused", result);
    }
}
