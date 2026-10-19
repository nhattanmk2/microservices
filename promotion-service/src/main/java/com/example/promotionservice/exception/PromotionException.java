package com.example.promotionservice.exception;

import org.springframework.http.HttpStatus;

public class PromotionException extends RuntimeException {

    private final HttpStatus status;

    public PromotionException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
    }

    public PromotionException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
