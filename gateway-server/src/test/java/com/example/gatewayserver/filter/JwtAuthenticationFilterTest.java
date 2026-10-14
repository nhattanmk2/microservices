package com.example.gatewayserver.filter;

import com.example.gatewayserver.config.SecurityProperties;
import com.example.gatewayserver.security.JwtUtils;
import com.netflix.zuul.context.RequestContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtUtils jwtUtils;

    private SecurityProperties securityProperties;
    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        RequestContext ctx = new RequestContext();
        RequestContext.testSetCurrentContext(ctx);

        securityProperties = new SecurityProperties();
        List<SecurityProperties.WhitelistRule> rules = new ArrayList<>();

        SecurityProperties.WhitelistRule authRule = new SecurityProperties.WhitelistRule();
        authRule.setPath("/api/auth/**");
        authRule.setMethods("GET,POST");
        rules.add(authRule);

        SecurityProperties.WhitelistRule productGetRule = new SecurityProperties.WhitelistRule();
        productGetRule.setPath("/api/products/**");
        productGetRule.setMethods("GET");
        rules.add(productGetRule);

        securityProperties.setWhitelist(rules);

        filter = new JwtAuthenticationFilter(jwtUtils, securityProperties);
    }

    @AfterEach
    void tearDown() {
        RequestContext.testSetCurrentContext(null);
    }

    @Test
    @DisplayName("Endpoint trong Whitelist (/api/auth/login) được bỏ qua filter")
    void shouldFilter_Whitelist_ReturnsFalse() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        RequestContext.getCurrentContext().setRequest(request);

        assertFalse(filter.shouldFilter());
    }

    @Test
    @DisplayName("GET /api/products thuộc Whitelist được bỏ qua filter")
    void shouldFilter_ProductGet_ReturnsFalse() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/products");
        RequestContext.getCurrentContext().setRequest(request);

        assertFalse(filter.shouldFilter());
    }

    @Test
    @DisplayName("POST /api/products không thuộc Whitelist phải qua filter")
    void shouldFilter_ProductPost_ReturnsTrue() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/products");
        RequestContext.getCurrentContext().setRequest(request);

        assertTrue(filter.shouldFilter());
    }

    @Test
    @DisplayName("Request cần xác thực nhưng thiếu header Authorization sẽ bị chặn với mã 401")
    void run_MissingAuthorizationHeader_RejectsWith401() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/products");
        MockHttpServletResponse response = new MockHttpServletResponse();
        RequestContext.getCurrentContext().setRequest(request);
        RequestContext.getCurrentContext().setResponse(response);

        filter.run();

        assertFalse(RequestContext.getCurrentContext().sendZuulResponse());
        assertEquals(401, RequestContext.getCurrentContext().getResponseStatusCode());
    }

    @Test
    @DisplayName("Request kèm token hợp lệ sẽ được chuyển tiếp và đính kèm header X-Auth-Username")
    void run_ValidToken_PropagatesUsernameHeader() {
        String token = "valid.jwt.token";
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/products");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        RequestContext.getCurrentContext().setRequest(request);
        RequestContext.getCurrentContext().setResponse(response);

        when(jwtUtils.validateToken(token)).thenReturn(true);
        when(jwtUtils.getUsernameFromToken(token)).thenReturn("john_doe");

        filter.run();

        assertTrue(RequestContext.getCurrentContext().sendZuulResponse());
        assertEquals("john_doe", RequestContext.getCurrentContext().getZuulRequestHeaders().get("x-auth-username"));
    }
}
