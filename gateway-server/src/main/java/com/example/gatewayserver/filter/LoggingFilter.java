package com.example.gatewayserver.filter;

import com.netflix.zuul.ZuulFilter;
import com.netflix.zuul.context.RequestContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.netflix.zuul.filters.support.FilterConstants;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;

/**
 * PRE filter: log mọi request đi vào Gateway và service đích mà Zuul sẽ chuyển tới.
 * Chạy sau PreDecorationFilter để đã có thông tin route (serviceId).
 */
@Component
public class LoggingFilter extends ZuulFilter {

    private static final Logger log = LoggerFactory.getLogger(LoggingFilter.class);

    @Override
    public String filterType() {
        return FilterConstants.PRE_TYPE;
    }

    @Override
    public int filterOrder() {
        return FilterConstants.PRE_DECORATION_FILTER_ORDER + 1;
    }

    @Override
    public boolean shouldFilter() {
        return true;
    }

    @Override
    public Object run() {
        RequestContext ctx = RequestContext.getCurrentContext();
        HttpServletRequest request = ctx.getRequest();
        Object serviceId = ctx.get(FilterConstants.SERVICE_ID_KEY);
        log.info(">>> [ZUUL] {} {}  ==>  {}", request.getMethod(), request.getRequestURI(),
                serviceId != null ? serviceId : "(no route)");
        return null;
    }
}
