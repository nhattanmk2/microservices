package com.example.gatewayserver.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilsTest {

    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", TEST_SECRET);
    }

    private String createToken(String username, long expirationMs) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(TEST_SECRET)), SignatureAlgorithm.HS256)
                .compact();
    }

    @Test
    @DisplayName("Validate token hợp lệ thành công")
    void validateToken_Success() {
        String token = createToken("admin_user", 60000);
        assertTrue(jwtUtils.validateToken(token));
        assertEquals("admin_user", jwtUtils.getUsernameFromToken(token));
    }

    @Test
    @DisplayName("Validate token hết hạn trả về false")
    void validateToken_Expired() {
        String expiredToken = createToken("expired_user", -1000);
        assertFalse(jwtUtils.validateToken(expiredToken));
    }

    @Test
    @DisplayName("Validate token sai chữ ký hoặc format hỏng trả về false")
    void validateToken_Malformed() {
        assertFalse(jwtUtils.validateToken("header.payload.signature_fake"));
    }
}
