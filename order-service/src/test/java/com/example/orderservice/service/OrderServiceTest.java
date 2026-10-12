package com.example.orderservice.service;

import com.example.orderservice.client.AuthClient;
import com.example.orderservice.client.ProductClient;
import com.example.orderservice.dto.OrderResponse;
import com.example.orderservice.dto.ProductDto;
import com.example.orderservice.dto.UserDto;
import com.example.orderservice.entity.Order;
import com.example.orderservice.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private AuthClient authClient;

    @Mock
    private ProductClient productClient;

    @InjectMocks
    private OrderService orderService;

    private Order sampleOrder;
    private UserDto sampleUser;
    private ProductDto sampleProduct;

    @BeforeEach
    void setUp() {
        sampleOrder = Order.builder()
                .id(1L)
                .buyerUsername("admin")
                .productId(10L)
                .quantity(2)
                .build();

        sampleUser = new UserDto(1L, "admin", "admin@example.com");

        sampleProduct = new ProductDto(10L, "Bàn phím cơ", new BigDecimal("100.00"), "Bàn phím cơ RGB");
    }

    @Test
    @DisplayName("Tạo đơn hàng mới thành công")
    void createOrder_Success() {
        // Given
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order orderToSave = invocation.getArgument(0);
            return Order.builder()
                    .id(1L)
                    .buyerUsername(orderToSave.getBuyerUsername())
                    .productId(orderToSave.getProductId())
                    .quantity(orderToSave.getQuantity())
                    .build();
        });

        // When
        Order createdOrder = orderService.createOrder("admin", 10L, 2);

        // Then
        assertNotNull(createdOrder.getId());
        assertEquals(1L, createdOrder.getId());
        assertEquals("admin", createdOrder.getBuyerUsername());
        assertEquals(10L, createdOrder.getProductId());
        assertEquals(2, createdOrder.getQuantity());

        verify(orderRepository, times(1)).save(any(Order.class));
    }

    @Test
    @DisplayName("Lấy chi tiết đơn hàng - tổng hợp dữ liệu từ AuthClient và ProductClient")
    void getOrderDetails_Success() {
        // Given
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));
        when(authClient.getUserByUsername("admin")).thenReturn(sampleUser);
        when(productClient.getProductById(10L)).thenReturn(sampleProduct);

        // When
        OrderResponse response = orderService.getOrderDetails(1L);

        // Then
        assertNotNull(response);
        assertEquals(1L, response.getOrderId());
        assertEquals(2, response.getQuantity());
        assertEquals(200.00, response.getTotalPrice());

        assertNotNull(response.getBuyer());
        assertEquals("admin", response.getBuyer().getUsername());
        assertEquals("admin@example.com", response.getBuyer().getEmail());

        assertNotNull(response.getProduct());
        assertEquals("Bàn phím cơ", response.getProduct().getName());
        assertEquals(new BigDecimal("100.00"), response.getProduct().getPrice());

        verify(orderRepository, times(1)).findById(1L);
        verify(authClient, times(1)).getUserByUsername("admin");
        verify(productClient, times(1)).getProductById(10L);
    }

    @Test
    @DisplayName("Ném ngoại lệ khi không tìm thấy đơn hàng")
    void getOrderDetails_OrderNotFound_ShouldThrowException() {
        // Given
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> orderService.getOrderDetails(99L));
        assertEquals("Order not found", exception.getMessage());

        verify(orderRepository, times(1)).findById(99L);
        verifyNoInteractions(authClient);
        verifyNoInteractions(productClient);
    }

    @Test
    @DisplayName("Xử lý ngoại lệ khi gọi Auth-Service thất bại")
    void getOrderDetails_AuthServiceFails_ShouldThrowException() {
        // Given
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));
        when(authClient.getUserByUsername("admin")).thenThrow(new RuntimeException("Connection refused from Auth-Service"));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> orderService.getOrderDetails(1L));
        assertEquals("Connection refused from Auth-Service", exception.getMessage());

        verify(orderRepository, times(1)).findById(1L);
        verify(authClient, times(1)).getUserByUsername("admin");
        verifyNoInteractions(productClient);
    }

    @Test
    @DisplayName("Xử lý ngoại lệ khi Product-Service bị timeout")
    void getOrderDetails_ProductServiceFails_ShouldThrowException() {
        // Given
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));
        when(authClient.getUserByUsername("admin")).thenReturn(sampleUser);
        when(productClient.getProductById(10L)).thenThrow(new RuntimeException("Read timed out executing GET Product-Service"));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> orderService.getOrderDetails(1L));
        assertEquals("Read timed out executing GET Product-Service", exception.getMessage());

        verify(orderRepository, times(1)).findById(1L);
        verify(authClient, times(1)).getUserByUsername("admin");
        verify(productClient, times(1)).getProductById(10L);
    }
}
