package com.example.gatewayserver.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;

@Component
public class JwtUtils {

    private static final Logger log = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    private Key key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    public String getUsernameFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token);
            return true;
        } catch (SignatureException e) {
            log.error("Chu ky JWT khong hop le: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.error("Token JWT khong dung dinh dang: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("Token JWT da het han: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("Token JWT khong duoc ho tro: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("Claims JWT trong hoac khong hop le: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Xac thuc JWT that bai: {}", e.getMessage());
        }
        return false;
    }
}
