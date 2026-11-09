package com.example.authservice.entity;

import lombok.Builder;
import lombok.Data;
import org.hibernate.annotations.Comment;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
public class User {
    
    public User() {
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Comment("Khoa chinh, dinh danh duy nhat cua nguoi dung")
    private Long id;
    
    @Column(nullable = false, unique = true)
    @Comment("Ten dang nhap cua nguoi dung (duy nhat toan he thong)")
    private String username;
    
    @Column(nullable = false)
    @Comment("Mat khau da duoc ma hoa bang thuat toan BCrypt")
    private String password;
    
    @Column(nullable = false, unique = true)
    @Comment("Dia chi email cua nguoi dung (duy nhat toan he thong)")
    private String email;
    
    @Comment("Vai tro phan quyen cua nguoi dung: USER hoac ADMIN")
    private String role;
    
    @Column(name = "created_at")
    @Comment("Thoi diem tao tai khoan")
    private LocalDateTime createdAt;
    
    @Builder
    public User(Long id, String username, String password, String email, String role, LocalDateTime createdAt) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.email = email;
        this.role = role;
        this.createdAt = createdAt;
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
