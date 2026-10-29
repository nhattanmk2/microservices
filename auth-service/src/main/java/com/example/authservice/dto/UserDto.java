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

    public UserDto(Long id, String username, String email) {
        this.id = id;
        this.username = username;
        this.email = email;
    }
}
