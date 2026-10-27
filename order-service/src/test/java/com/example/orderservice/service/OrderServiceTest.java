package com.example.orderservice.service;

import com.example.orderservice.client.AuthClient;
import com.example.orderservice.client.ProductClient;
import com.example.orderservice.client.PromotionClient;
import com.example.orderservice.dto.*;
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

    @Mock
    private PromotionClient promotionClient;

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
                .totalPrice(200.0)
                .discountAmount(0.0)
                .status("CREATED")
                .build();

        sampleUser = new UserDto(1L, "admin", "admin@example.com");

        sampleProduct = new ProductDto(10L, "Bàn phím cơ", new BigDecimal("100.00"), "Bàn phím cơ RGB");
    }

    @Test
    @DisplayName("Tạo đơn hàng mới không kèm voucher thành công")
    void createOrder_Success() {
        // Given
        when(productClient.getProductById(10L)).thenReturn(sampleProduct);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order orderToSave = invocation.getArgument(0);
            return Order.builder()
                    .id(1L)
                    .buyerUsername(orderToSave.getBuyerUsername())
                    .productId(orderToSave.getProductId())
                    .quantity(orderToSave.getQuantity())
                    .totalPrice(orderToSave.getTotalPrice())
                    .discountAmount(orderToSave.getDiscountAmount())
                    .status("CREATED")
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
        assertEquals(200.0, createdOrder.getTotalPrice());

        verify(orderRepository, times(1)).save(any(Order.class));
        verifyNoInteractions(promotionClient);
    }

    @Test
    @DisplayName("Tạo đơn hàng kèm voucher hợp lệ: tính giảm giá và gọi consumePromotion")
    void createOrder_ValidPromo_Success() {
        // Given
        when(productClient.getProductById(10L)).thenReturn(sampleProduct);

        ApplyPromotionResponse promoResponse = ApplyPromotionResponse.builder()
                .valid(true)
                .promotionCode("SALE20")
                .discountType("PERCENTAGE")
                .discountAmount(BigDecimal.valueOf(40.0)) // 200 * 20% = 40
                .finalTotal(BigDecimal.valueOf(160.0))
                .build();

        when(promotionClient.applyPromotion(any(ApplyPromotionRequest.class), eq("admin"))).thenReturn(promoResponse);

        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            return Order.builder()
                    .id(50L)
                    .buyerUsername(o.getBuyerUsername())
                    .productId(o.getProductId())
                    .quantity(o.getQuantity())
                    .promotionCode(o.getPromotionCode())
                    .discountAmount(o.getDiscountAmount())
                    .totalPrice(o.getTotalPrice())
                    .status("CREATED")
                    .build();
        });

        // When
        Order createdOrder = orderService.createOrder("admin", 10L, 2, "SALE20");

        // Then
        assertNotNull(createdOrder);
        assertEquals(50L, createdOrder.getId());
        assertEquals("SALE20", createdOrder.getPromotionCode());
        assertEquals(40.0, createdOrder.getDiscountAmount());
        assertEquals(160.0, createdOrder.getTotalPrice());

        verify(promotionClient, times(1)).applyPromotion(any(ApplyPromotionRequest.class), eq("admin"));
        verify(promotionClient, times(1)).consumePromotion(any(ConsumePromotionRequest.class), eq("admin"));
        verify(orderRepository, times(1)).save(any(Order.class));
    }

    @Test
    @DisplayName("Hủy đơn hàng có voucher: gọi hoàn lại voucher (refundPromotion) thành công")
    void cancelOrder_WithPromo_Refunds() {
        // Given
        Order orderWithPromo = Order.builder()
                .id(99L)
                .buyerUsername("john")
                .productId(10L)
                .quantity(1)
                .promotionCode("SALE20")
                .discountAmount(20.0)
                .totalPrice(80.0)
                .status("CREATED")
                .build();

        when(orderRepository.findById(99L)).thenReturn(Optional.of(orderWithPromo));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        Order cancelledOrder = orderService.cancelOrder(99L);

        // Then
        assertNotNull(cancelledOrder);
        assertEquals("CANCELLED", cancelledOrder.getStatus());
        verify(promotionClient, times(1)).refundPromotion(any(RefundPromotionRequest.class), eq("john"));
        verify(orderRepository, times(1)).save(orderWithPromo);
    }

    @Test
    @DisplayName("Lấy chi tiết đơn hàng - tổng hợp dữ liệu từ AuthClient và ProductClient")
    void getOrder_Success() {
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
    void getOrder_NotFound_Throws() {
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
    void getOrder_AuthFail_Throws() {
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
    void getOrder_ProductFail_Throws() {
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
