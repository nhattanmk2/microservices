package com.example.authservice.service;

import com.example.authservice.dto.AuthResponse;
import com.example.authservice.dto.LoginRequest;
import com.example.authservice.dto.RegisterRequest;
import com.example.authservice.dto.UserDto;
import com.example.authservice.entity.User;
import com.example.authservice.repository.UserRepository;
import com.example.authservice.security.JwtUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("Đăng ký tài khoản thành công")
    void register_Success() {
        // Given
        RegisterRequest request = new RegisterRequest("john", "rawPassword123", "john@example.com");

        when(userRepository.findByUsername("john")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("rawPassword123")).thenReturn("$2a$10$hashedPasswordHere");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        String result = authService.register(request);

        // Then
        assertEquals("User registered successfully", result);

        verify(passwordEncoder, times(1)).encode("rawPassword123");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Đăng nhập thành công và trả về access token")
    void login_Success() {
        // Given
        LoginRequest request = new LoginRequest("john", "rawPassword123");
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("john");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(
                User.builder().id(1L).username("john").email("john@example.com").role("USER").build()
        ));
        when(jwtUtils.generateToken(eq("john"), anyString())).thenReturn("mocked.jwt.token.12345");

        // When
        AuthResponse response = authService.login(request);

        // Then
        assertNotNull(response);
        assertEquals("mocked.jwt.token.12345", response.getAccessToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals("Login successful", response.getMessage());

        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtUtils, times(1)).generateToken(eq("john"), eq("USER"));
    }

    @Test
    @DisplayName("Lấy thông tin User theo username thành công")
    void getUserByUsername_Success() {
        // Given
        User user = User.builder()
                .id(10L)
                .username("john")
                .email("john@example.com")
                .role("USER")
                .build();
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));

        // When
        UserDto dto = authService.getUserByUsername("john");

        // Then
        assertNotNull(dto);
        assertEquals(10L, dto.getId());
        assertEquals("john", dto.getUsername());
        assertEquals("john@example.com", dto.getEmail());

        verify(userRepository, times(1)).findByUsername("john");
    }

    @Test
    @DisplayName("Ném ngoại lệ khi đăng ký với username đã tồn tại")
    void register_UsernameAlreadyExists_ShouldThrowException() {
        // Given
        RegisterRequest request = new RegisterRequest("existingUser", "password", "exist@example.com");
        User existingUser = User.builder().id(1L).username("existingUser").build();

        when(userRepository.findByUsername("existingUser")).thenReturn(Optional.of(existingUser));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.register(request));
        assertEquals("Username already exists", exception.getMessage());

        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ném ngoại lệ BadCredentialsException khi sai mật khẩu")
    void login_BadCredentials_ShouldThrowException() {
        // Given
        LoginRequest request = new LoginRequest("john", "wrongPassword");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        // When & Then
        BadCredentialsException exception = assertThrows(BadCredentialsException.class, () -> authService.login(request));
        assertEquals("Bad credentials", exception.getMessage());

        verifyNoInteractions(jwtUtils);
    }

    @Test
    @DisplayName("Ném ngoại lệ khi không tìm thấy user theo username")
    void getUserByUsername_NotFound_ShouldThrowException() {
        // Given
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.getUserByUsername("unknown"));
        assertEquals("User not found", exception.getMessage());

        verify(userRepository, times(1)).findByUsername("unknown");
    }
}
