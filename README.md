# Hệ Thống Microservices Quản Lý Sản Phẩm (Tuần 1)

Dự án này là kết quả thực hành xây dựng hệ thống **Microservices Backend** bằng Java Spring Boot trong 7 ngày đầu tiên. Hệ thống áp dụng kiến trúc cơ bản với giao tiếp HTTP nội bộ và bảo mật hoàn chỉnh bằng JWT.

## 🛠 Công nghệ sử dụng
- **Java 17**
- **Spring Boot 2.7.18** (Spring Web, Spring Data JPA, Spring Security)
- **MySQL 8** (Lưu trữ dữ liệu riêng rẽ cho từng service)
- **JJWT** (Sinh và kiểm chứng Token JSON Web Token)

## 🏗 Kiến trúc hệ thống
Hệ thống gồm 2 dịch vụ độc lập:
1. **Auth-Service (Cổng 8081)**: Quản lý người dùng, mã hóa mật khẩu, đăng nhập, và cấp phát thẻ thông hành (JWT).
2. **Product-Service (Cổng 8082)**: Quản lý thông tin sản phẩm. Được bảo vệ bởi Spring Security, bắt buộc người dùng phải có JWT (cấp bởi Auth-Service) mới được quyền thêm sản phẩm mới.

## 🚀 Hướng dẫn chạy dự án
### 1. Chuẩn bị Cơ sở dữ liệu
- Mở MySQL Workbench.
- Tạo 2 database rỗng:
  ```sql
  CREATE DATABASE auth_db;
  CREATE DATABASE product_db;
  ```

### 2. Cấu hình Mật khẩu
- Mở file `application.yml` ở cả 2 thư mục `auth-service` và `product-service`.
- Sửa lại `username` và `password` cho khớp với MySQL trên máy của bạn.

### 3. Khởi động
Mở 2 cửa sổ Terminal (Command Prompt/PowerShell) riêng biệt ở gốc thư mục của từng service và chạy:
```bash
# Ở thư mục auth-service
mvn spring-boot:run

# Ở thư mục product-service
mvn spring-boot:run
```

## 🧪 Kịch bản Test End-to-End (E2E) bằng Postman
**Bước 1: Đăng ký tài khoản (Auth-Service)**
- `POST http://localhost:8081/api/auth/register`
- Body (JSON):
```json
{
    "username": "admin",
    "password": "123",
    "email": "admin@example.com"
}
```

**Bước 2: Đăng nhập lấy Token (Auth-Service)**
- `POST http://localhost:8081/api/auth/login`
- Body (JSON):
```json
{
    "username": "admin",
    "password": "123"
}
```
> 👉 *Hãy COPY chuỗi Token cực dài trả về.*

**Bước 3: Xem danh sách sản phẩm (Product-Service) - Không cần Token**
- `GET http://localhost:8082/api/products`

**Bước 4: Thêm sản phẩm mới (Product-Service) - Bắt buộc có Token**
- `POST http://localhost:8082/api/products`
- **Header**: Chuyển sang tab Authorization -> Chọn `Bearer Token` -> Dán chuỗi Token vừa copy vào.
- Body (JSON):
```json
{
    "name": "Macbook Pro M3",
    "price": 2000,
    "description": "Laptop xịn"
}
```
