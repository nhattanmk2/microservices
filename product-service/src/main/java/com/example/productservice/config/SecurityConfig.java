package com.example.productservice.config;

import com.example.productservice.security.AuthTokenFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors().and()
            .csrf().disable() // Disable CSRF for REST API
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS).and()
            .authorizeRequests()
                // Cho phép mọi người được xem danh sách sản phẩm (GET)
                .antMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                // Các thao tác thêm, sửa, xóa (POST, PUT, DELETE) bắt buộc phải có Token
                .anyRequest().authenticated()
            .and()
            .httpBasic().disable()
            .formLogin().disable();

        // Gắn chốt chặn kiểm tra Token vào
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
