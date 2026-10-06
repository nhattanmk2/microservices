# 🛒 Hệ thống Microservices E-Commerce Cơ bản

Dự án mô phỏng hệ thống thương mại điện tử sử dụng kiến trúc Microservices, xây dựng trên nền tảng Spring Boot & Spring Cloud. 

## 1. Công nghệ sử dụng
- **Java**: 11 / 17
- **Framework chính**: Spring Boot 2.7.18
- **Microservices Stack**: Spring Cloud 2021.0.8 (Riêng Gateway dùng Boot 2.3.12 / Hoxton.SR12)
  - **Netflix Eureka**: Đăng ký và khám phá dịch vụ (Service Registry)
  - **Netflix Zuul**: Cổng điều hướng tập trung (API Gateway)
  - **OpenFeign**: Giao tiếp nội bộ giữa các service
  - **Spring Cloud Config**: Quản lý cấu hình tập trung lưu trữ trên GitHub
- **Cơ sở dữ liệu**: MySQL 8.0 & Spring Data JPA
- **Bảo mật**: Spring Security & JWT (JSON Web Token)
- **Kiểm thử**: JUnit 5 & Mockito

## 2. Sơ đồ Kiến trúc (Architecture)

```text
[ C L I E N T ]  ====>  [ ZUUL GATEWAY (Port: 8080) ]
                                |
             +------------------+------------------+
             |                                     |
  [ AUTH SERVICE (Port: 8081) ]         [ PRODUCT SERVICE (Port: 8082) ]
             |                                     |
             +--------[ EUREKA REGISTRY (8761) ]---+
           
(Toàn bộ cấu hình được lấy từ CONFIG SERVER (8888) liên kết với GitHub Repo)
```

## 3. Yêu cầu Hệ thống & Cài đặt

1. Đảm bảo đã cài đặt JDK 11 hoặc 17 và Maven.
2. Cài đặt MySQL Server.
3. Tạo cơ sở dữ liệu rỗng trong MySQL. Hibernate sẽ tự động tạo bảng (tùy thuộc vào `ddl-auto`):
```sql
CREATE DATABASE auth_db;
CREATE DATABASE product_db;
```

## 4. Thứ tự khởi động dịch vụ (RẤT QUAN TRỌNG)

Mở 5 cửa sổ Terminal (hoặc Command Prompt) khác nhau. Khởi động lần lượt theo đúng thứ tự (đợi service trước báo chạy thành công rồi mới bật service sau):

1. **`config-server`** (Cổng 8888): Chạy đầu tiên để kéo cấu hình từ GitHub.
   ```bash
   cd config-server
   mvn spring-boot:run
   ```
2. **`eureka-server`** (Cổng 8761): 
   ```bash
   cd eureka-server
   mvn spring-boot:run
   ```
3. **`auth-service`** (Cổng 8081):
   ```bash
   cd auth-service
   mvn spring-boot:run
   ```
4. **`product-service`** (Cổng 8082):
   ```bash
   cd product-service
   mvn spring-boot:run
   ```
5. **`gateway-server`** (Cổng 8080): Chạy cuối cùng và đợi khoảng 30s để Zuul đồng bộ danh sách API từ Eureka.
   ```bash
   cd gateway-server
   mvn spring-boot:run
   ```

## 5. Danh sách API Test qua Gateway (Cổng 8080)

> URL gốc để test: `http://localhost:8080`

### 5.1. Auth Service
* **Đăng ký tài khoản mới**
  - **Method**: `POST`
  - **Endpoint**: `/api/auth/register`
  - **Body (JSON)**:
    ```json
    {
        "username": "admin",
        "password": "password123",
        "email": "admin@example.com"
    }
    ```

* **Đăng nhập (Lấy Token)**
  - **Method**: `POST`
  - **Endpoint**: `/api/auth/login`
  - **Body (JSON)**:
    ```json
    {
        "username": "admin",
        "password": "password123"
    }
    ```

* **Lấy thông tin User hiện tại (Yêu cầu Token)**
  - **Method**: `GET`
  - **Endpoint**: `/api/auth/me`
  - **Headers**: `Authorization: Bearer <Your_JWT_Token>`

### 5.2. Product Service
* **Lấy danh sách tất cả sản phẩm**
  - **Method**: `GET`
  - **Endpoint**: `/api/products`

* **Test giao tiếp nội bộ (Product -> Auth)**
  - **Method**: `GET`
  - **Endpoint**: `/api/products/check-auth`
