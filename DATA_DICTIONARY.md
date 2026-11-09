# Từ điển Dữ liệu Hệ thống (Database Data Dictionary)
### E-Commerce Microservices Architecture (Spring Boot & MySQL 8.0)

Tài liệu chi tiết mô tả cấu trúc, kiểu dữ liệu, các ràng buộc và ý nghĩa nghiệp vụ của 4 cơ sở dữ liệu phân tán trong hệ thống theo mô hình **Database-per-Service**.

---

## 1. Danh mục Cơ sở dữ liệu (Database Catalog)

| Database | Microservice sở hữu | Cổng kết nối | Mục đích nghiệp vụ chính |
| :--- | :--- | :---: | :--- |
| **`auth_db`** | `auth-service` | 3306 | Quản lý người dùng, mật khẩu băm BCrypt, vai trò phân quyền (USER/ADMIN) |
| **`product_db`** | `product-service` | 3306 | Quản lý danh mục sản phẩm thương mại, giá niêm yết và số lượng tồn kho |
| **`order_db`** | `order-service` | 3306 | Xử lý giao dịch đặt hàng, ghi nhận tổng thanh toán, chiết khấu và trạng thái đơn |
| **`promotion_db`** | `promotion-service` | 3306 | Quản lý mã voucher, kiểm tra điều kiện áp dụng, chiết khấu và chống race condition |

---

## 2. Chi tiết Cấu trúc & Chú thích Bảng (Table Schemas)

### 2.1. Cơ sở dữ liệu `auth_db`

#### Bảng: `users`
- **Mô tả nghiệp vụ**: Lưu trữ thông tin tài khoản, thông tin đăng nhập và phân quyền của toàn bộ người dùng trong hệ sinh thái.
- **Engine**: InnoDB | **Charset**: utf8mb4 | **Collate**: utf8mb4_unicode_ci

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Chú thích nghiệp vụ (Column Comment) |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `BIGINT` | PK, AUTO_INCREMENT | — | Khóa chính, định danh duy nhất của người dùng |
| `username` | `VARCHAR(255)` | NOT NULL, UNIQUE | — | Tên đăng nhập của người dùng (duy nhất toàn hệ thống) |
| `password` | `VARCHAR(255)` | NOT NULL | — | Mật khẩu đã được mã hóa bằng thuật toán BCrypt |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | — | Địa chỉ email của người dùng (duy nhất toàn hệ thống) |
| `role` | `VARCHAR(255)` | NULL | `'USER'` | Vai trò phân quyền: `USER` (khách mua) hoặc `ADMIN` (quản trị) |
| `created_at` | `DATETIME` | NULL | `CURRENT_TIMESTAMP` | Thời điểm tạo tài khoản |

---

### 2.2. Cơ sở dữ liệu `product_db`

#### Bảng: `products`
- **Mô tả nghiệp vụ**: Quản lý danh mục hàng hóa, giá niêm yết và số lượng hàng sẵn có trong kho (tích hợp cache Redis).
- **Engine**: InnoDB | **Charset**: utf8mb4 | **Collate**: utf8mb4_unicode_ci

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Chú thích nghiệp vụ (Column Comment) |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `BIGINT` | PK, AUTO_INCREMENT | — | Khóa chính, định danh duy nhất của sản phẩm |
| `name` | `VARCHAR(255)` | NOT NULL | — | Tên sản phẩm thương mại |
| `description` | `VARCHAR(255)` | NULL | — | Mô tả chi tiết về đặc tính, thông số sản phẩm |
| `price` | `DECIMAL(19,2)` | NOT NULL | — | Giá niêm yết của sản phẩm (đơn vị: VND) |
| `stock` | `INT` | NULL | `0` | Số lượng sản phẩm còn tồn trong kho hàng |
| `created_at` | `DATETIME` | NULL | `CURRENT_TIMESTAMP` | Thời điểm sản phẩm được tạo và nhập vào hệ thống |

---

### 2.3. Cơ sở dữ liệu `order_db`

#### Bảng: `t_orders`
- **Mô tả nghiệp vụ**: Quản lý các giao dịch đặt mua sản phẩm của khách hàng, tích hợp tính chiết khấu voucher và hủy đơn hoàn trả lượt dùng.
- **Engine**: InnoDB | **Charset**: utf8mb4 | **Collate**: utf8mb4_unicode_ci

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Chú thích nghiệp vụ (Column Comment) |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `BIGINT` | PK, AUTO_INCREMENT | — | Khóa chính, mã định danh duy nhất của đơn hàng |
| `buyer_username` | `VARCHAR(255)` | NULL | — | Tên tài khoản người mua hàng (*tham chiếu logic tới `auth_db.users.username`*) |
| `product_id` | `BIGINT` | NULL | — | Mã định danh sản phẩm được đặt mua (*tham chiếu logic tới `product_db.products.id`*) |
| `quantity` | `INT` | NOT NULL | `1` | Số lượng sản phẩm được đặt trong đơn hàng |
| `promotion_code` | `VARCHAR(255)` | NULL | — | Mã voucher giảm giá đã được áp dụng (*tham chiếu logic tới `promotion_db.promotions.code`*) |
| `discount_amount`| `DOUBLE` | NULL | `0.0` | Số tiền được chiết khấu giảm giá từ voucher |
| `total_price` | `DOUBLE` | NULL | `0.0` | Tổng số tiền khách hàng cần thanh toán thực tế sau giảm giá |
| `status` | `VARCHAR(255)` | NULL | `'CREATED'` | Trạng thái đơn hàng: `CREATED` (Đã tạo) hoặc `CANCELLED` (Đã hủy) |

---

### 2.4. Cơ sở dữ liệu `promotion_db`

#### Bảng 1: `promotions`
- **Mô tả nghiệp vụ**: Định nghĩa các chương trình khuyến mại, mã voucher, thể lệ chiết khấu và điều kiện áp dụng.
- **Engine**: InnoDB | **Charset**: utf8mb4 | **Collate**: utf8mb4_unicode_ci

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Chú thích nghiệp vụ (Column Comment) |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `BIGINT` | PK, AUTO_INCREMENT | — | Khóa chính, mã định danh duy nhất của voucher |
| `code` | `VARCHAR(50)` | NOT NULL, UNIQUE | — | Mã code voucher người dùng nhập vào (duy nhất toàn hệ thống) |
| `name` | `VARCHAR(150)` | NOT NULL | — | Tên chương trình khuyến mãi |
| `description` | `TEXT` | NULL | — | Mô tả chi tiết điều kiện và thể lệ áp dụng voucher |
| `discount_type` | `VARCHAR(20)` | NOT NULL | — | Loại hình chiết khấu: `PERCENTAGE` (theo %) hoặc `FIXED_AMOUNT` (số tiền cố định) |
| `discount_value`| `DECIMAL(12,2)` | NOT NULL | — | Giá trị giảm giá: tỷ lệ % (nếu PERCENTAGE) hoặc số tiền VND (nếu FIXED_AMOUNT) |
| `min_order_value`| `DECIMAL(12,2)` | NULL | `0.00` | Giá trị đơn hàng tối thiểu cần đạt để được áp dụng voucher |
| `max_discount_amount`| `DECIMAL(12,2)`| NULL | — | Số tiền giảm tối đa (áp dụng khi discount_type là PERCENTAGE) |
| `usage_limit` | `INT` | NOT NULL | `100` | Tổng số lượt sử dụng tối đa của voucher trên toàn hệ thống |
| `used_count` | `INT` | NOT NULL | `0` | Số lượt voucher đã được khách hàng tiêu dùng thực tế |
| `limit_per_user`| `INT` | NOT NULL | `1` | Số lượt tối đa một tài khoản người dùng được phép áp dụng voucher |
| `start_date` | `DATETIME` | NOT NULL | — | Thời điểm bắt đầu có hiệu lực của voucher |
| `end_date` | `DATETIME` | NOT NULL | — | Thời điểm hết hạn của voucher |
| `is_active` | `TINYINT(1)` | NOT NULL | `1` | Trạng thái kích hoạt: 1 (đang hoạt động), 0 (tạm dừng) |
| `created_at` | `DATETIME` | NULL | `CURRENT_TIMESTAMP` | Thời điểm tạo chương trình voucher |

#### Bảng 2: `promotion_products`
- **Mô tả nghiệp vụ**: Quy định mã voucher chỉ áp dụng cho một số sản phẩm chỉ định (độc quyền theo sản phẩm).
- **Engine**: InnoDB | **Charset**: utf8mb4 | **Collate**: utf8mb4_unicode_ci

| Tên cột | Kiểu dữ liệu | Ràng buộc | Chú thích nghiệp vụ (Column Comment) |
| :--- | :--- | :---: | :--- |
| `id` | `BIGINT` | PK, AUTO_INCREMENT | Khóa chính, định danh bản ghi liên kết |
| `promotion_id` | `BIGINT` | NOT NULL, INDEX | Mã định danh chương trình khuyến mãi (*tham chiếu `promotions.id`*) |
| `product_id` | `BIGINT` | NOT NULL, INDEX | Mã định danh sản phẩm được áp dụng (*tham chiếu logic tới `product_db.products.id`*) |

#### Bảng 3: `promotion_usages`
- **Mô tả nghiệp vụ**: Ghi nhận vết tiêu dùng voucher cho từng đơn hàng, phục vụ chống race condition, kiểm tra giới hạn mỗi user và hỗ trợ hoàn lượt dùng khi hủy đơn hàng.
- **Engine**: InnoDB | **Charset**: utf8mb4 | **Collate**: utf8mb4_unicode_ci

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Chú thích nghiệp vụ (Column Comment) |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `BIGINT` | PK, AUTO_INCREMENT | — | Khóa chính, định danh bản ghi tiêu dùng voucher |
| `promotion_id` | `BIGINT` | NOT NULL, INDEX | — | Mã định danh chương trình khuyến mãi (*tham chiếu `promotions.id`*) |
| `promotion_code`| `VARCHAR(50)` | NOT NULL | — | Mã voucher đã được khách hàng sử dụng |
| `buyer_username`| `VARCHAR(100)` | NOT NULL, INDEX | — | Tên tài khoản người mua hàng (*tham chiếu logic tới `auth_db.users.username`*) |
| `order_id` | `BIGINT` | NOT NULL, INDEX | — | Mã đơn hàng áp dụng voucher này (*tham chiếu logic tới `order_db.t_orders.id`*) |
| `discount_amount`| `DECIMAL(12,2)`| NOT NULL | — | Số tiền thực tế đã được chiết khấu giảm giá cho đơn hàng |
| `status` | `VARCHAR(20)` | NOT NULL | `'USED'` | Trạng thái lượt dùng: `USED` (Đã dùng) hoặc `REFUNDED` (Đã hoàn lại khi hủy đơn) |
| `used_at` | `DATETIME` | NULL | `CURRENT_TIMESTAMP` | Thời điểm khách hàng sử dụng voucher để tạo đơn hàng |
| `refunded_at` | `DATETIME` | NULL | — | Thời điểm hệ thống hoàn trả lại lượt dùng voucher khi đơn hàng bị hủy |

---

## 3. Ma trận Ràng buộc & Khóa ngoại Logic (Logical Foreign Keys)

Trong kiến trúc Microservices phân tán, các ràng buộc toàn vẹn giữa các domain services không được ép buộc bởi database engine mà được bảo đảm bởi tầng ứng dụng:

```text
[auth_db.users] (username)
       ▲
       ├── (buyer_username) ── [order_db.t_orders]
       └── (buyer_username) ── [promotion_db.promotion_usages]

[product_db.products] (id)
       ▲
       ├── (product_id) ────── [order_db.t_orders]
       └── (product_id) ────── [promotion_db.promotion_products]

[promotion_db.promotions] (code / id)
       ▲
       ├── (promotion_code) ── [order_db.t_orders]
       ├── (promotion_id) ──── [promotion_db.promotion_products] (Internal FK)
       └── (promotion_id) ──── [promotion_db.promotion_usages]   (Internal FK)
```

