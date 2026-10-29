# E-Commerce Microservices Architecture

Hệ thống backend thương mại điện tử xây dựng theo kiến trúc Microservices phân tán, phát triển trên hệ sinh thái Spring Boot và Spring Cloud. Dự án thiết kế theo các tiêu chuẩn kiến trúc hướng dịch vụ, giải quyết các bài toán về Service Discovery, Centralized Configuration, API Gateway Routing, Inter-Service Communication, Stateless Authentication và Automated Unit Testing.

---

## 1. System Architecture & Communication Flow

```text
[ Client Applications / Consumers ]
                 │
                 ▼
     [ API Gateway (Zuul) : 8080 ] ───────────────────┐
                 │                                    │
                 │ (Reverse Proxy / Routing)          │
                 ▼                                    │
    ┌───────────────────────────────┐                 │
    │    Business Microservices     │                 ▼
    │  ├─ Auth Service      (8081)  │ ◄── [ Eureka Service Registry : 8761 ]
    │  ├─ Product Service   (8082)  │        (Heartbeat & Discovery)
    │  ├─ Order Service     (8083)  │                 ▲
    │  └─ Promotion Service (8084)  │                 │
    └──────────────┬────────────────┘                 │
                   │ (OpenFeign Inter-service)        │
                   ▼                                  │
      [ Centralized Config (8888) ] ──────────────────┘
           (Git-backed config)
```

### Communication Patterns

- **Edge Routing & API Gateway**: `gateway-server` tiếp nhận toàn bộ traffic bên ngoài, định tuyến động tới các business microservices dựa trên Service ID đăng ký từ Eureka.
- **Service Discovery**: Các service tự động đăng ký metadata với `eureka-server` và định kỳ gửi heartbeat để duy trì trạng thái khả dụng.
- **Inter-Service Communication**: Sử dụng declarative REST client (`OpenFeign`) để thực hiện các lời gọi dịch vụ nội bộ (e.g., `order-service` tổng hợp dữ liệu đồng thời từ `auth-service`, `product-service` và tính/hoàn voucher từ `promotion-service`).
- **Security & Token Propagation**: Xác thực phi trạng thái (Stateless) qua JWT; gateway hỗ trợ cấu hình bypass cho các public endpoint và forward authorization headers (`X-Auth-Username`, `X-Auth-Role`) cho downstream services.
- **Centralized Configuration**: Quản lý tập trung toàn bộ cấu hình môi trường thông qua `config-server` liên kết GitHub repository.

---

## 2. Technology Stack & Version Matrix

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime & Language** | OpenJDK | 17 | Nền tảng thực thi chính |
| **Core Framework** | Spring Boot | 2.7.18 | Business microservices framework |
| **Cloud Ecosystem** | Spring Cloud | 2021.0.8 | Hỗ trợ kiến trúc phân tán |
| **Edge Gateway** | Netflix Zuul | Boot 2.3.12 / Hoxton.SR12 | Reverse proxy, dynamic routing, request filtering |
| **Discovery Registry** | Netflix Eureka | Spring Cloud Starter | Service registration & discovery |
| **Distributed Config** | Spring Cloud Config Server | 2021.0.8 | Quản lý cấu hình tập trung qua Git |
| **Inter-Service Client** | Spring Cloud OpenFeign | OpenFeign 3.x | Declarative REST client nội bộ |
| **Persistence Layer** | Spring Data JPA / Hibernate | 2.7.18 | ORM & quản lý truy xuất cơ sở dữ liệu |
| **Database** | MySQL Server | 8.0 | Hệ quản trị cơ sở dữ liệu quan hệ |
| **Distributed Cache** | Redis | 7.0-Alpine | Cache dữ liệu sản phẩm và user, giảm tải DB & tăng tốc độ phản hồi |
| **Security** | Spring Security & JJWT | 0.9.1 | Xác thực JWT & phân quyền truy cập (Admin/User) |
| **Automated Testing** | JUnit 5 & Mockito | Jupiter / Mockito 4.x | Unit Testing cho Service Layer theo chuẩn BDD |

---

## 3. Service Catalog & Port Allocation

| Service Name | Port | Service ID | Database | Chức năng chính |
| :--- | :---: | :--- | :--- | :--- |
| `config-server` | **8888** | `config-server` | — | Nạp và phân phối cấu hình từ Git |
| `eureka-server` | **8761** | `eureka-server` | — | Service Discovery Server |
| `auth-service` | **8081** | `auth-service` | `auth_db` + Redis | Đăng ký, đăng nhập, cấp phát JWT, cache user qua Redis |
| `product-service` | **8082** | `product-service` | `product_db` + Redis | Quản lý sản phẩm, tồn kho, cache danh mục & chi tiết sản phẩm qua Redis |
| `order-service` | **8083** | `order-service` | In-Memory / JPA | Xử lý đơn hàng, áp dụng voucher, hủy đơn hoàn khuyến mãi |
| `promotion-service` | **8084** | `promotion-service` | `promotion_db` | Quản lý mã voucher, kiểm tra điều kiện, tính chiết khấu & chống race condition |
| `gateway-server` | **8080** | `gateway-server` | — | Điểm vào duy nhất cho API, reverse proxy, JWT filter & header propagation |

---

## 4. Prerequisites & Infrastructure Setup

### Yêu cầu môi trường

- Java Development Kit (JDK) 17+
- Apache Maven 3.8+
- MySQL 8.0 & Redis 7 (hoặc Docker engine)

### Khởi tạo hạ tầng (MySQL & Redis)

Khởi chạy container MySQL và Redis thông qua `docker-compose.yml` có sẵn tại thư mục gốc:

```bash
docker compose up -d
```

Hoặc tạo database thủ công trên MySQL instance cục bộ:

```sql
CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS product_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS promotion_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 5. Startup Sequence & Execution Guide

Do có sự phụ thuộc về cấu hình và service registry, các service cần được khởi động theo thứ tự sau:

1. **Phase 1: Core Infrastructure**
   - `config-server` (`ConfigServerApplication.java` - Port **8888**): Chờ nạp Git repo thành công.
   - `eureka-server` (`EurekaServerApplication.java` - Port **8761**): Dashboard khả dụng tại `http://localhost:8761`.

2. **Phase 2: Business Domain Services**
   - `auth-service` (`AuthServiceApplication.java` - Port **8081**)
   - `product-service` (`ProductServiceApplication.java` - Port **8082**)
   - `order-service` (`OrderServiceApplication.java` - Port **8083**)
   - `promotion-service` (`PromotionServiceApplication.java` - Port **8084**)

3. **Phase 3: Edge Routing**
   - `gateway-server` (`GatewayServerApplication.java` - Port **8080**): Chờ 15–30 giây để Zuul hoàn tất chu kỳ fetch registry định kỳ từ Eureka.

> **IntelliJ Services Dashboard**: Có thể gộp toàn bộ các Application vào tool window **Services** (`Alt + 8` hoặc `View -> Tool Windows -> Services`) để quản lý lifecycle tập trung.

---

## 6. API Specification (via Gateway :8080)

Toàn bộ request từ client được gửi qua Gateway tại `http://localhost:8080`.

### 6.1. Authentication Service (`/api/auth/**`)

| Method | Endpoint | Headers | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | `Content-Type: application/json` | Đăng ký tài khoản người dùng mới |
| `POST` | `/api/auth/login` | `Content-Type: application/json` | Xác thực thông tin, trả về Bearer Token |
| `GET` | `/api/auth/users/{username}` | — | Internal endpoint: Feign query UserDto |
| `GET` | `/api/auth/status` | — | Health/status check endpoint |

**Payload Đăng ký (`POST /api/auth/register`):**

```json
{
  "username": "admin",
  "password": "password123",
  "email": "admin@example.com"
}
```

**Payload Đăng nhập (`POST /api/auth/login`):**

```json
{
  "username": "admin",
  "password": "password123"
}
```

### 6.2. Product Service (`/api/products/**`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/products` | Public | Lấy danh sách toàn bộ sản phẩm |
| `GET` | `/api/products/{id}` | Public | Lấy chi tiết sản phẩm theo ID |
| `POST` | `/api/products` | Bearer Token | Tạo sản phẩm mới |
| `GET` | `/api/products/external-demo` | Public | Kiểm tra kết nối liên service (Product -> Auth) |

### 6.3. Order Service (`/api/orders/**`)

| Method | Endpoint | Query / Path Params | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | `productId`, `quantity`, `promotionCode` (optional) | Tạo đơn hàng mới, tự động tính chiết khấu và consume voucher |
| `GET` | `/api/orders/{id}` | `id` (Order ID) | Lấy chi tiết đơn hàng (tổng hợp dữ liệu qua Feign kèm thông tin chiết khấu) |
| `POST` | `/api/orders/{id}/cancel` | `id` (Order ID) | Hủy đơn hàng và tự động hoàn lại lượt sử dụng voucher (Refund Promotion) |

### 6.4. Promotion Service (`/api/promotions/**`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/promotions` | Public | Lấy danh sách toàn bộ khuyến mãi / voucher đang có hiệu lực |
| `GET` | `/api/promotions/{code}` | Public | Lấy chi tiết thông tin và điều kiện của mã voucher |
| `GET` | `/api/promotions/product/{productId}` | Public | Lấy danh sách voucher áp dụng được cho sản phẩm cụ thể |
| `POST` | `/api/promotions/apply` | Public / Bearer | Đánh giá & tính toán số tiền giảm giá cho đơn hàng |
| `POST` | `/api/promotions/consume` | Internal / Feign | Ghi nhận sử dụng voucher và tăng `used_count` (chống race condition) |
| `POST` | `/api/promotions/refund` | Internal / Feign | Hoàn lại lượt sử dụng voucher khi đơn hàng bị hủy |
| `POST` | `/api/promotions` | ADMIN (Role) | Tạo mới chương trình khuyến mãi / voucher (yêu cầu quyền ADMIN) |
| `PATCH` | `/api/promotions/{id}/status` | ADMIN (Role) | Bật / tắt trạng thái kích hoạt của khuyến mãi (`?active=true/false`) |

---

## 7. Automated Testing & Quality Assurance

Hệ thống áp dụng phương pháp kiểm thử tự động ở tầng Service Layer theo chuẩn **Behavior-Driven Development (BDD: Given - When - Then)** với **JUnit 5** và **Mockito**.

Toàn bộ test cases áp dụng nguyên tắc **Dependency Isolation**: cô lập hoàn toàn I/O, database và network calls để đảm bảo tính deterministic và tốc độ thực thi cao.

### 7.1. Test Suites Matrix (37/37 Passed - 100%)

| Service | Test Class | Total Tests | Test Scenarios Covered | Status |
| :--- | :--- | :---: | :--- | :---: |
| `gateway-server` | `JwtUtilsTest`, `JwtAuthenticationFilterTest` | 10 | JWT token generation & HMAC-SHA verification; Expiration & malformed token rejection; Whitelist path bypass (`/api/auth/**`, `GET /api/products`, `GET /api/promotions`); Missing header 401 rejection; Identity & Role propagation via `X-Auth-Username`, `X-Auth-Role` headers | **PASSED** (100%) |
| `auth-service` | `AuthServiceTest` | 6 | User registration with BCrypt hashing; Role assignment (USER/ADMIN); Username duplicate collision prevention; Authentication & JWT generation with role claim; Feign user lookup | **PASSED** (100%) |
| `product-service` | `ProductServiceTest` | 4 | Query all products mapping to DTOs; Product persistence with default inventory; Feign integration status check; Fallback error handling when upstream fails | **PASSED** (100%) |
| `order-service` | `OrderServiceTest` | 7 | Order creation without voucher; **Order creation with voucher: calculate discount & consume voucher**; Order cancellation with voucher refund; Order details aggregation from Auth & Product; Not found & timeout exception handling | **PASSED** (100%) |
| `promotion-service` | `PromotionServiceTest` | 10 | Percentage discount with max cap; Fixed amount discount; Expired voucher rejection; Minimum order value condition; Global usage limit; Per-user limit enforcement; Specific product applicability; Atomic consume; Voucher refund on cancel; Admin RBAC authorization | **PASSED** (100%) |

### 7.2. Test Execution

Chạy test theo từng service:

```bash
# Gateway Server test suite (Security, Role Propagation & Zuul Filter)
mvn -f gateway-server/pom.xml test

# Auth Service test suite (Authentication & Role-based JWT)
mvn -f auth-service/pom.xml test

# Product Service test suite
mvn -f product-service/pom.xml test

# Order Service test suite (Promotion Feign integration & Refund)
mvn -f order-service/pom.xml test

# Promotion Service test suite (Engine, Atomic Concurrency & RBAC)
mvn -f promotion-service/pom.xml test
```

---

## 8. Postman Integration

Dự án cung cấp bộ Postman collection và environment đồng bộ tại thư mục `postman/`:

- **Collection**: Tập hợp toàn bộ request phân loại theo từng microservice, có sẵn pre-configured headers và request body.
- **Environment**: Định nghĩa biến môi trường `gateway_url` (`http://localhost:8080`) và token tự động trích xuất sau khi đăng nhập.
- **Cách sử dụng**: Trong Postman, chọn **Import** -> trỏ đến thư mục `postman/` để nạp toàn bộ cấu hình vào workspace.
