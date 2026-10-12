# E-Commerce Microservices Architecture

Hệ thống backend thương mại điện tử xây dựng theo kiến trúc Microservices phân tán, phát triển trên hệ sinh thái Spring Boot và Spring Cloud. Dự án thiết kế theo các tiêu chuẩn kiến trúc hướng dịch vụ, giải quyết các bài toán về Service Discovery, Centralized Configuration, API Gateway Routing, Inter-Service Communication, Stateless Authentication và Automated Unit Testing.

---

## 1. System Architecture & Communication Flow

```text
[ Client Applications / Consumers ]
                 │
                 ▼
     [ API Gateway (Zuul) : 8080 ] ─────────────┐
                 │                              │
                 │ (Reverse Proxy / Routing)    │
                 ▼                              │
    ┌─────────────────────────┐                 │
    │  Business Microservices │                 ▼
    │  ├─ Auth Service (8081) │ ◄── [ Eureka Service Registry : 8761 ]
    │  ├─ Product Service(8082)        (Heartbeat & Discovery)
    │  └─ Order Service (8083)│                 ▲
    └────────────┬────────────┘                 │
                 │ (OpenFeign Inter-service)    │
                 ▼                              │
    [ Centralized Config (8888) ] ──────────────┘
         (Git-backed config)
```

### Communication Patterns
- **Edge Routing & API Gateway**: `gateway-server` tiếp nhận toàn bộ traffic bên ngoài, định tuyến động tới các business microservices dựa trên Service ID đăng ký từ Eureka.
- **Service Discovery**: Các service tự động đăng ký metadata với `eureka-server` và định kỳ gửi heartbeat để duy trì trạng thái khả dụng.
- **Inter-Service Communication**: Sử dụng declarative REST client (`OpenFeign`) để thực hiện các lời gọi dịch vụ nội bộ (e.g., `order-service` tổng hợp dữ liệu đồng thời từ `auth-service` và `product-service`).
- **Security & Token Propagation**: Xác thực phi trạng thái (Stateless) qua JWT; gateway hỗ trợ cấu hình bypass cho các public endpoint và forward authorization headers cho downstream services.
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
| **Security** | Spring Security & JJWT | 0.9.1 | Xác thực JWT & phân quyền truy cập |
| **Automated Testing** | JUnit 5 & Mockito | Jupiter / Mockito 4.x | Unit Testing cho Service Layer theo chuẩn BDD |

---

## 3. Service Catalog & Port Allocation

| Service Name | Port | Service ID | Database | Chức năng chính |
| :--- | :---: | :--- | :--- | :--- |
| `config-server` | **8888** | `config-server` | — | Nạp và phân phối cấu hình từ Git |
| `eureka-server` | **8761** | `eureka-server` | — | Service Discovery Server |
| `auth-service` | **8081** | `auth-service` | `auth_db` | Đăng ký, đăng nhập, cấp phát JWT, xác thực user |
| `product-service` | **8082** | `product-service` | `product_db` | Quản lý danh mục sản phẩm, tồn kho |
| `order-service` | **8083** | `order-service` | In-Memory / JPA | Xử lý đơn hàng, tổng hợp thông tin qua Feign |
| `gateway-server` | **8080** | `gateway-server` | — | Điểm vào duy nhất cho API, reverse proxy |

---

## 4. Prerequisites & Infrastructure Setup

### Yêu cầu môi trường
- Java Development Kit (JDK) 17+
- Apache Maven 3.8+
- MySQL 8.0 (hoặc Docker engine)

### Khởi tạo cơ sở dữ liệu (MySQL)
Khởi chạy container MySQL thông qua `docker-compose.yml` có sẵn tại thư mục gốc:

```bash
docker compose up -d
```

Hoặc tạo database thủ công trên MySQL instance cục bộ:
```sql
CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS product_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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
| `POST` | `/api/orders` | `buyerUsername`, `productId`, `quantity` | Tạo đơn hàng mới |
| `GET` | `/api/orders/{id}` | `id` (Order ID) | Lấy chi tiết đơn hàng (tổng hợp dữ liệu qua Feign) |

---

## 7. Automated Testing & Quality Assurance

Hệ thống áp dụng phương pháp kiểm thử tự động ở tầng Service Layer theo chuẩn **Behavior-Driven Development (BDD: Given - When - Then)** với **JUnit 5** và **Mockito**.

Toàn bộ test cases áp dụng nguyên tắc **Dependency Isolation**: cô lập hoàn toàn I/O, database và network calls để đảm bảo tính deterministic và tốc độ thực thi cao.

### 7.1. Test Suites Matrix (15/15 Passed)

| Service | Test Class | Total Tests | Test Scenarios Covered | Status |
| :--- | :--- | :---: | :--- | :---: |
| `auth-service` | `AuthServiceTest` | 6 | • User registration with BCrypt hashing<br>• Username duplicate collision prevention<br>• Authentication & JWT generation<br>• Bad credentials exception handling<br>• Feign user lookup by username<br>• User not found exception handling | **PASSED** (100%) |
| `product-service` | `ProductServiceTest` | 4 | • Query all products mapping to DTOs<br>• Product persistence with default inventory<br>• Feign integration status check<br>• Fallback error handling when upstream fails | **PASSED** (100%) |
| `order-service` | `OrderServiceTest` | 5 | • Order creation with generated ID<br>• **Data aggregation from Auth & Product clients**<br>• Order not found short-circuit verification<br>• Auth-Service unavailable error handling<br>• Product-Service read timeout handling | **PASSED** (100%) |

### 7.2. Test Execution

Chạy test theo từng service:
```bash
# Auth Service test suite
mvn -f auth-service/pom.xml test

# Product Service test suite
mvn -f product-service/pom.xml test

# Order Service test suite
mvn -f order-service/pom.xml test
```

---

## 8. Postman Integration

Dự án cung cấp bộ Postman collection và environment đồng bộ tại thư mục `postman/`:
- **Collection**: Tập hợp toàn bộ request phân loại theo từng microservice, có sẵn pre-configured headers và request body.
- **Environment**: Định nghĩa biến môi trường `gateway_url` (`http://localhost:8080`) và token tự động trích xuất sau khi đăng nhập.
- **Cách sử dụng**: Trong Postman, chọn **Import** -> trỏ đến thư mục `postman/` để nạp toàn bộ cấu hình vào workspace.
