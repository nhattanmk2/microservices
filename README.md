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
             +------------------+------------------+------------------+
             |                                     |                  |
  [ AUTH SERVICE (8081) ]         [ PRODUCT SERVICE (8082) ]   [ ORDER SERVICE (8083) ]
             |                                     |                  |
             +--------[ EUREKA REGISTRY (8761) ]---+------------------+
           
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

## 4. Hướng dẫn chạy Project bằng IntelliJ IDEA

Dự án này bao gồm nhiều module độc lập. Thứ tự khởi động là **VÔ CÙNG QUAN TRỌNG**. Hãy chạy từng service một và chờ service đó báo "Started" trong console trước khi chạy service tiếp theo:

1. **`config-server` (Cổng 8888)**: Chạy file `ConfigServerApplication.java` đầu tiên để lấy cấu hình từ GitHub.
2. **`eureka-server` (Cổng 8761)**: Chạy file `EurekaServerApplication.java` để bật Discovery Service.
3. **`auth-service` (Cổng 8081)**: Chạy file `AuthServiceApplication.java`.
4. **`product-service` (Cổng 8082)**: Chạy file `ProductServiceApplication.java`.
5. **`order-service` (Cổng 8083)**: Chạy file `OrderServiceApplication.java`.
6. **`gateway-server` (Cổng 8080)**: Chạy file `GatewayServerApplication.java` cuối cùng. (Đợi khoảng 30s sau khi khởi động để Zuul kịp đồng bộ danh sách API từ Eureka).

*Mẹo trên IntelliJ:* Bạn có thể mở công cụ **Services** (`View -> Tool Windows -> Services`), thêm cấu hình `Spring Boot` để có thể quản lý và bấm chạy nhanh toàn bộ các microservices cùng lúc ở một giao diện duy nhất.

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
  - **Endpoint**: `/api/products/external-demo`

### 5.3. Order Service
* **Tạo đơn hàng mới (Gọi Product & Auth Service)**
  - **Method**: `POST`
  - **Endpoint**: `/api/orders?buyerUsername=admin&productId=1&quantity=2`

* **Lấy chi tiết đơn hàng (Kèm thông tin User và Product)**
  - **Method**: `GET`
  - **Endpoint**: `/api/orders/1`

### 5.4. Hướng dẫn Test API bằng Postman
Dự án đã tích hợp sẵn thư mục `postman/` chứa các cấu hình tự động. Để test dễ dàng:
1. Mở phần mềm **Postman**.
2. Bấm vào **Import** và chọn thư mục `postman/` nằm ở thư mục gốc của project (hoặc trỏ tới file `collections/` bên trong).
3. Toàn bộ các API đã được cấu hình sẵn môi trường (Environment) và các Endpoint.
4. Bạn chỉ cần bấm chạy lần lượt các Request đã lưu thay vì phải tự gõ tay lại!
