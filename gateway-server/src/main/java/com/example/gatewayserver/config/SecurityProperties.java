package com.example.gatewayserver.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "security")
public class SecurityProperties {

    private List<WhitelistRule> whitelist = new ArrayList<>();

    public List<WhitelistRule> getWhitelist() {
        return whitelist;
    }

    public void setWhitelist(List<WhitelistRule> whitelist) {
        this.whitelist = whitelist;
    }

    public static class WhitelistRule {
        private String path;
        private String methods;

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }

        public String getMethods() {
            return methods;
        }

        public void setMethods(String methods) {
            this.methods = methods;
        }
    }
}
