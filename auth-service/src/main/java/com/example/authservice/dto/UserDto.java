package com.example.authservice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@NoArgsConstructor
public class UserDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String username;
    private String email;
    private String role;
    private String createdAt;

    public UserDto(Long id, String username, String email) {
        this(id, username, email, "USER", null);
    }

    public UserDto(Long id, String username, String email, String role, String createdAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role != null ? role : "USER";
        this.createdAt = createdAt;
    }
}
