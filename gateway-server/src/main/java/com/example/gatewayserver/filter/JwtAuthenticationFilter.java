package com.example.gatewayserver.filter;

import com.example.gatewayserver.config.SecurityProperties;
import com.example.gatewayserver.security.JwtUtils;
import com.netflix.zuul.ZuulFilter;
import com.netflix.zuul.context.RequestContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.netflix.zuul.filters.support.FilterConstants;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;

import javax.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;

/**
 * Zuul pre-filter responsible for validating JWT tokens at the API Gateway level
 * and propagating the authenticated user's identity to downstream services.
 */
@Component
@SuppressWarnings("null")
public class JwtAuthenticationFilter extends ZuulFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtils jwtUtils;
    private final SecurityProperties securityProperties;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public JwtAuthenticationFilter(JwtUtils jwtUtils, SecurityProperties securityProperties) {
        this.jwtUtils = jwtUtils;
        this.securityProperties = securityProperties;
    }

    @Override
    public String filterType() {
        return FilterConstants.PRE_TYPE;
    }

    @Override
    public int filterOrder() {
        return FilterConstants.PRE_DECORATION_FILTER_ORDER - 1;
    }

    @Override
    public boolean shouldFilter() {
        RequestContext ctx = RequestContext.getCurrentContext();
        HttpServletRequest request = ctx.getRequest();
        String requestUri = request.getRequestURI();
        String method = request.getMethod();

        // Check if request matches any whitelist rule
        if (securityProperties.getWhitelist() != null) {
            for (SecurityProperties.WhitelistRule rule : securityProperties.getWhitelist()) {
                if (rule.getPath() != null && pathMatcher.match(rule.getPath(), requestUri)) {
                    if (!StringUtils.hasText(rule.getMethods())) {
                        return false;
                    }
                    String[] allowedMethods = rule.getMethods().split(",");
                    for (String allowedMethod : allowedMethods) {
                        if (allowedMethod.trim().equalsIgnoreCase(method)) {
                            return false;
                        }
                    }
                }
            }
        }

        return true;
    }

    @Override
    public Object run() {
        RequestContext ctx = RequestContext.getCurrentContext();
        HttpServletRequest request = ctx.getRequest();

        String authHeader = request.getHeader("Authorization");

        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            log.warn("Unauthorized request to {}: missing or invalid Authorization header", request.getRequestURI());
            rejectRequest(ctx, HttpStatus.UNAUTHORIZED, "Thieu hoac sai dinh dang Authorization header (Bearer token)");
            return null;
        }

        String token = authHeader.substring(7).trim();
        if (!jwtUtils.validateToken(token)) {
            log.warn("Unauthorized request to {}: invalid or expired token", request.getRequestURI());
            rejectRequest(ctx, HttpStatus.UNAUTHORIZED, "Token khong hop le hoac da het han");
            return null;
        }

        String username = jwtUtils.getUsernameFromToken(token);
        if (!StringUtils.hasText(username)) {
            log.warn("Unauthorized request to {}: subject missing in token", request.getRequestURI());
            rejectRequest(ctx, HttpStatus.UNAUTHORIZED, "Khong tim thay thong tin nguoi dung trong token");
            return null;
        }

        String role = jwtUtils.getRoleFromToken(token);

        log.info("Authenticated request for user '{}' (role: '{}') => {}", username, role, request.getRequestURI());
        // Propagate authenticated identity to downstream services (and override any spoofed client header)
        ctx.addZuulRequestHeader("X-Auth-Username", username);
        if (StringUtils.hasText(role)) {
            ctx.addZuulRequestHeader("X-Auth-Role", role);
        }

        return null;
    }

    private void rejectRequest(RequestContext ctx, HttpStatus status, String message) {
        ctx.setSendZuulResponse(false);
        ctx.setResponseStatusCode(status.value());
        if (ctx.getResponse() != null) {
            ctx.getResponse().setContentType(MediaType.APPLICATION_JSON_VALUE);
            ctx.getResponse().setCharacterEncoding(StandardCharsets.UTF_8.name());
        }
        ctx.setResponseBody(String.format("{\"status\":%d,\"error\":\"%s\",\"message\":\"%s\"}",
                status.value(), status.getReasonPhrase(), message));
    }
}
