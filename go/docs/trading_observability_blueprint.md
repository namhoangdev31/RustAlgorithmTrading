# Trading Observability API & Data Storage Blueprint for Go

Tài liệu này chi tiết hóa các API Endpoint và cấu trúc Database (Datatables) sẽ được triển khai cho Go API & Observability Gateway, dựa trên kế hoạch **Trading Observability Production Plan**.

---

## 1. Quy tắc Thiết kế API (Contract Rules)

* **Prefix**: `/api/v1`
* **Spec**: OpenAPI 3.1
* **DTOs**: Tất cả response phải sử dụng các Struct DTOs được định nghĩa kiểu cụ thể. Nghiêm cấm sử dụng các kiểu dữ liệu động, không có cấu trúc như `map[string]interface{}` hoặc `gin.H` đối với các response public.
* **Error Envelope**: Tất cả lỗi trả về từ API đều phải sử dụng chung một cấu trúc chuẩn (Envelope):

```json
{
  "error": {
    "code": "ORDER_REJECTED_RISK_LIMIT",
    "message": "Order exceeds max notional limit",
    "correlation_id": "cid_...",
    "retryable": false,
    "details": {}
  }
}
```

* **Correlation ID**: Mỗi response từ API phải bao gồm hoặc echo lại header `X-Correlation-ID`.
* **Traceability**: Mọi resource đều phải có stable ID, timestamp (`created_at`, `updated_at`), và status enum rõ ràng.
* **Idempotency**: Tất cả các unsafe endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) thay đổi trạng thái giao dịch bắt buộc phải có header `Idempotency-Key` để tránh double-execution.
* **Audit**: Các unsafe endpoints phải tự động sinh và lưu trữ audit events.
* **Pagination**: Các read endpoints danh sách phải hỗ trợ phân trang (pagination), cursor-based, bộ lọc (filters), và xác định thứ tự sắp xếp cụ thể.

---

## 2. Chi tiết các REST API Endpoint (111 REST Endpoints)

### 2.1 Read-Only Market Data (7 REST Endpoints)

Quản lý thông tin thị trường, cung cấp dữ liệu giá, nến, sổ lệnh phục vụ UI/UX và kiểm tra trước giao dịch.

| Method | Endpoint | Purpose | Client meaning |
|---|---|---|---|
| `GET` | `/api/v1/market/products` | Danh sách sản phẩm được giao dịch và metadata. | Giúp mobile hiển thị danh sách symbol tìm kiếm được và xác định tài sản nào được hỗ trợ trước khi đặt lệnh. |
| `GET` | `/api/v1/market/products/{symbol}` | Chi tiết tick size, lot size, min notional, asset class, trạng thái được phép giao dịch. | Cung cấp cho client quy tắc validation đối với giá/khối lượng nhập vào và trạng thái vô hiệu hóa giao dịch. |
| `GET` | `/api/v1/market/ticker?symbols=AAPL,MSFT` | Giá tốt nhất hiện tại (best quote) và tóm tắt giao dịch cuối cùng. | Phục vụ watchlists, portfolio marks, và danh sách báo giá nhanh mà không cần load toàn bộ chart. |
| `GET` | `/api/v1/market/order-book/{symbol}` | Snapshot sổ lệnh chuẩn hóa. | Hiển thị bid/ask depth và tính thanh khoản của sản phẩm dưới cấu trúc chuẩn hóa, độc lập với broker. |
| `GET` | `/api/v1/market/trades/{symbol}` | Các market trades gần đây nhất. | Hiển thị các lệnh khớp gần nhất (time-and-sales) phục vụ phân tích thị trường. |
| `GET` | `/api/v1/market/candles/{symbol}` | Nến lịch sử OHLCV kèm khung thời gian và phân trang. | Phục vụ vẽ biểu đồ giá, dữ liệu lịch sử và các chỉ báo kỹ thuật overlays. |
| `GET` | `/api/v1/market/status` | Giờ thị trường, trạng thái phiên, độ trễ dữ liệu, trạng thái provider. | Cho UI biết thị trường đang mở hay đóng cửa, dữ liệu có bị cũ không, hoặc provider có bị lỗi không. |

**Required DTOs:** `Product`, `Ticker`, `OrderBookSnapshot`, `MarketTrade`, `Candle`, `MarketStatus`.

---

### 2.2 Account, Portfolio, Positions & Watchlists (15 REST Endpoints)

Cung cấp thông tin tài khoản, trạng thái danh mục đầu tư, vị thế hiện tại và quản lý danh sách theo dõi của người dùng.

| Method | Endpoint | Purpose | Client meaning |
|---|---|---|---|
| `GET` | `/api/v1/account/status` | Trạng thái tài khoản, chế độ giao dịch (live/paper), các hạn chế và quyền hạn. | Quyết định xem app sẽ hiển thị chế độ read-only, paper trading hay live trading. |
| `GET` | `/api/v1/portfolio/summary` | Tài sản ròng (equity), tiền mặt (cash), sức mua (buying power), P/L trong ngày, và độ phơi nhiễm (exposure). | Hiển thị header trên dashboard chính của danh mục đầu tư và tóm tắt rủi ro tài khoản. |
| `GET` | `/api/v1/portfolio/history` | Chuỗi thời gian tài sản ròng và biến động P/L. | Phục vụ biểu đồ hiệu năng tài khoản theo các mốc ngày, tuần, tháng hoặc khoảng thời gian tùy chọn. |
| `GET` | `/api/v1/positions` | Danh sách các vị thế đang mở. | Hiển thị danh mục holding hiện tại gồm số lượng, giá trung bình, giá trị thị trường và P/L. |
| `GET` | `/api/v1/positions/{symbol}` | Chi tiết của một vị thế cụ thể. | Hiển thị màn hình chi tiết vị thế gồm các lô (lots), exposure, và các action khả dụng. |
| `GET` | `/api/v1/positions/events` | Dòng thời gian của vị thế (tính toán từ fills và điều chỉnh của broker). | Giúp đội ngũ hỗ trợ (support) và người dùng nâng cao hiểu rõ tại sao vị thế thay đổi. |
| `GET` | `/api/v1/portfolio/valuation` | Định giá danh mục hiện tại dựa trên dữ liệu từ các engine định giá, tiền mặt và vị thế. | Hiển thị equity, exposure kèm cảnh báo giá cũ (stale price warning). |
| `GET` | `/api/v1/portfolio/allocations` | Tỷ lệ phân bổ danh mục theo tài sản, symbol, sector, strategy và account. | Phục vụ hiển thị phân bổ rủi ro và kiểm tra mức độ tập trung vị thế theo chiến thuật. |
| `GET` | `/api/v1/pricing/marks?symbols=AAPL,MSFT` | Giá mark chuẩn hóa và độ tươi mới của giá. | Cung cấp giá mark thống nhất cho mobile và order preview thay vì báo giá raw từ provider. |
| `GET` | `/api/v1/pricing/fx-rates` | Tỷ giá FX được sử dụng để định giá. | Phục vụ định giá danh mục đầu tư đa tiền tệ và phục vụ kiểm toán (audit). |
| `GET` | `/api/v1/watchlists` | Danh sách các watchlists của tài khoản. | Load danh sách theo dõi của user để hiển thị tại màn hình Home/Market. |
| `POST` | `/api/v1/watchlists` | Tạo mới một watchlist. | Cho phép user tạo nhóm theo dõi symbol tùy chỉnh. |
| `PATCH` | `/api/v1/watchlists/{id}` | Cập nhật tên hoặc metadata của watchlist. | Cho phép user đổi tên, thay đổi thứ tự hoặc tùy chỉnh watchlist. |
| `POST` | `/api/v1/watchlists/{id}/symbols` | Thêm symbol vào watchlist. | Thêm một mã giao dịch vào danh sách theo dõi sau khi kiểm tra tính hợp lệ của symbol. |
| `DELETE` | `/api/v1/watchlists/{id}/symbols/{symbol}` | Xóa symbol khỏi watchlist. | Xóa mã khỏi watchlist mà không ảnh hưởng tới vị thế hay lệnh đang chạy. |

**Required DTOs:** `AccountStatus`, `PortfolioSummary`, `PortfolioPoint`, `Position`, `Watchlist`.

---

### 2.3 Orders, Fills, and Trades (9 REST Endpoints)

Quản lý thông tin lệnh, dữ liệu khớp lệnh (fills), lịch sử giao dịch thương mại (trades) và các hành động đặt lệnh/hủy lệnh.

#### A. Read-Only (5 REST Endpoints)
| Method | Endpoint | Purpose | Client meaning |
|---|---|---|---|
| `GET` | `/api/v1/orders` | Danh sách lệnh kèm các bộ lọc trạng thái, symbol, side và ngày tháng. | Phục vụ màn hình lịch sử đặt lệnh, open orders và các bộ lọc trạng thái. |
| `GET` | `/api/v1/orders/{order_id}` | Chi tiết lệnh và lịch sử vòng đời của lệnh. | Hiển thị chi tiết tại sao lệnh đang chờ, đã khớp, đã hủy, bị từ chối hoặc bị lỗi. |
| `GET` | `/api/v1/fills` | Danh sách các lần khớp lệnh (executions). | Hiển thị lịch sử các lần khớp được tạo ra bởi lệnh, bao gồm cả khớp một phần (partial fills). |
| `GET` | `/api/v1/fills/{fill_id}` | Chi tiết của một lượt khớp. | Hiển thị giá khớp, số lượng, phí, thông tin sàn/provider và correlation ID. |
| `GET` | `/api/v1/trades` | Lịch sử giao dịch thương mại (được tổng hợp từ các sự kiện orders/fills). | Hiển thị lịch sử giao dịch thân thiện với người dùng sau khi chuẩn hóa raw events. |

#### B. Trading Actions (4 REST Endpoints)
| Method | Endpoint | Purpose | Client meaning |
|---|---|---|---|
| `POST` | `/api/v1/orders/preview` | Ước lượng và validate lệnh trước khi submit. | Chạy kiểm tra sản phẩm, tài khoản, rủi ro, sức mua, và ước tính chi phí trước khi user xác nhận đặt lệnh. |
| `POST` | `/api/v1/orders` | Đặt lệnh mới. (Yêu cầu `Idempotency-Key`). | Tạo lệnh live hoặc paper sau khi vượt qua các chốt chặn preview, auth, risk, idempotency, và audit. |
| `POST` | `/api/v1/orders/{order_id}/cancel` | Yêu cầu hủy lệnh. (Yêu cầu `Idempotency-Key`). | Gửi yêu cầu hủy tới broker và ghi nhận toàn bộ vòng đời thay đổi trạng thái. |
| `POST` | `/api/v1/orders/{order_id}/replace` | Thay đổi lệnh. (Yêu cầu `Idempotency-Key`). | Thay đổi các trường được phép của lệnh thông qua luồng cancel/replace có kiểm soát. |

#### Order State Machine (Vòng đời trạng thái bắt buộc)
```
received -> previewed -> accepted -> routed -> broker_acknowledged
         -> partially_filled -> filled
         -> cancel_requested -> canceled
         -> rejected
         -> expired
         -> failed
```

**Mỗi sự kiện chuyển đổi trạng thái (Transition) bắt buộc phải ghi lại:**
* `from_status` và `to_status`
* `timestamp`
* `source`: ví dụ `go_api`, `rust_execution`, `broker`, `risk`
* `correlation_id`
* `reason_code`
* `raw_provider_ref` (chỉ lưu trữ nội bộ hệ thống)

---

### 2.4 Risk, Safety, and Admin (9 REST Endpoints)

Cung cấp thông tin rủi ro, cấu hình hạn mức giao dịch, và các cổng ngắt khẩn cấp (kill-switches).

| Method | Endpoint | Purpose | Client meaning |
|---|---|---|---|
| `GET` | `/api/v1/risk/status` | Trạng thái rủi ro hiện tại (Read-Only). | Cho biết giao dịch đang bình thường, bị giới hạn, bị dừng (halted) hay suy giảm hiệu năng. |
| `GET` | `/api/v1/risk/limits` | Các hạn mức giao dịch đang có hiệu lực. | Hiển thị max notional, exposure, drawdown, rate limits áp dụng cho user/tài khoản. |
| `GET` | `/api/v1/risk/decisions` | Nhật ký (audit trail) các quyết định rủi ro. | Giúp support/admin kiểm tra tại sao một lệnh/preview bị chặn hoặc được duyệt. |
| `GET` | `/api/v1/risk/exposure` | Độ phơi nhiễm hiện tại theo symbol, sector, strategy và account. | Kiểm tra xem chiến thuật giao dịch có đang bị tập trung quá nhiều rủi ro trước khi đặt lệnh hay không. |
| `GET` | `/api/v1/risk/circuit-breakers` | Trạng thái các bộ ngắt mạch (circuit breakers) hiện tại và lịch sử. | Giải thích tại sao giao dịch bị tạm dừng hoặc bóp băng thông ngay cả khi tài khoản vẫn khỏe mạnh. |
| `POST` | `/api/v1/admin/risk/limits` | Cập nhật hạn mức rủi ro (Admin-only). | Thay đổi các hạn mức rủi ro có hiệu lực kèm lịch sử audit, phiên bản và cơ chế rollback. |
| `POST` | `/api/v1/admin/risk/kill-switch` | Kích hoạt dừng giao dịch khẩn cấp (Admin-only). | Dừng ngay lập tức các hoạt động giao dịch không an toàn trong phạm vi cấu hình. |
| `DELETE` | `/api/v1/admin/risk/kill-switch` | Khôi phục giao dịch sau sự cố (Admin-only). | Cho phép giao dịch trở lại sau khi xem xét sự cố và có phê duyệt audit. |
| `POST` | `/api/v1/admin/trading/read-only-mode` | Ép buộc chế độ Read-Only (Admin-only). | Đưa toàn bộ client vào trạng thái chỉ xem danh mục/thị trường và khóa các chức năng đặt lệnh. |

---

### 2.5 System Observability (7 REST Endpoints)

Cung cấp dữ liệu giám sát sức khỏe hệ thống, trạng thái các component và metrics vận hành.

| Method | Endpoint | Purpose | Client meaning |
|---|---|---|---|
| `GET` | `/api/v1/system/health` | Sức khỏe tổng hợp của hệ thống. | Cấp cho mobile và ops trạng thái chung của Go, Rust, broker, storage và event bus. |
| `GET` | `/api/v1/system/components` | Trạng thái chi tiết và độ trễ dữ liệu của từng component. | Cho biết subsystem nào đang lỗi: API, Rust market data, risk, execution, broker, Postgres, Redis, hoặc DuckDB. |
| `GET` | `/api/v1/system/incidents` | Danh sách sự cố hiển thị cho user/admin hiện tại. | Phục vụ hiển thị banner cảnh báo trên UI và danh sách sự cố cho đội vận hành. |
| `POST` | `/api/v1/system/incidents/{id}/acknowledge` | Ghi nhận sự cố (Admin/ops only). | Xác nhận một operator đã tiếp nhận và đang xử lý sự cố. |
| `POST` | `/api/v1/system/incidents/{id}/resolve` | Giải quyết sự cố (Admin/ops only). | Đóng sự cố kèm theo lịch sử audit và thông tin khôi phục. |
| `GET` | `/api/v1/observability/metrics/current` | Các metrics hệ thống, API và giao dịch hiện tại. | Phục vụ live dashboard về latency, error rates, order state, và risk state. |
| `GET` | `/api/v1/observability/metrics/history` | Dữ liệu lịch sử metrics kèm các bộ lọc. | Phục vụ phân tích xu hướng, điều tra sự cố và so sánh hiệu năng giữa các phiên bản release. |

---

### 2.6 Auth, Sessions, and Devices (5 REST Endpoints)

Quản lý phiên đăng nhập và bảo mật thiết bị truy cập của người dùng.

| Method | Endpoint | Purpose | Client meaning |
|---|---|---|---|
| `POST` | `/api/v1/auth/firebase` | Khởi tạo session từ Firebase OAuth ID token được Go xác thực bằng Firebase Admin SDK credentials. | Thay thế các API keys dùng chung bằng token bảo mật gán với định danh user. |
| `POST` | `/api/v1/auth/refresh` | Rotate access token bằng refresh token. | Duy trì session đăng nhập của mobile mà không cần lưu access token với thời hạn quá dài. |
| `POST` | `/api/v1/auth/logout` | Đăng xuất và thu hồi trạng thái của refresh token. | Cho phép user hủy session hoạt động hiện tại vì lý do bảo mật. |
| `GET` | `/api/v1/devices` | Danh sách thiết bị đã liên kết với tài khoản user. | Giúp người dùng kiểm tra các điện thoại/máy tính bảng tin cậy đã đăng nhập. |
| `DELETE` | `/api/v1/devices/{id}` | Hủy liên kết thiết bị và thu hồi toàn bộ session liên quan. | Cho phép user xóa thiết bị cũ hoặc thiết bị bị mất/không tin cậy. |

---

### 2.7 Account Snapshots and Cash (3 REST Endpoints)

Cung cấp thông tin lịch sử số dư tài khoản và biến động dòng tiền mặt.

| Method | Endpoint | Purpose | Client meaning |
|---|---|---|---|
| `GET` | `/api/v1/account/snapshots` | Lịch sử snapshot trạng thái tài khoản. | Giúp client giải thích các thay đổi về số dư, quyền hạn hoặc hạn chế theo dòng thời gian. |
| `GET` | `/api/v1/cash/balances` | Tiền mặt hiện tại, sức mua, tiền mặt chờ về (unsettled), và tiền mặt bị phong tỏa (reserved). | Cung cấp số dư tiền mặt chính xác cho màn hình đặt lệnh và danh mục đầu tư. |
| `GET` | `/api/v1/cash/movements` | Sổ cái biến động tiền mặt (chuyển tiền, phí, kết quả giao dịch, điều chỉnh). | Giúp user đối soát nguyên nhân số dư tiền mặt thay đổi. |

---

### 2.8 Order Reconciliation, Audit, and Broker Diagnostics (9 REST Endpoints)

Các API phục vụ đối soát trạng thái lệnh, dữ liệu kiểm toán và chuẩn chẩn đoán kết nối broker.

| Method | Endpoint | Purpose | Client meaning |
|---|---|---|---|
| `GET` | `/api/v1/orders/{order_id}/transitions` | Lịch sử chuyển đổi trạng thái lệnh chuẩn hóa. | Hiển thị chi tiết các mốc trạng thái của lệnh mà không lộ raw payload của broker. |
| `GET` | `/api/v1/orders/{order_id}/events` | Dòng thời gian sự kiện nội bộ của một lệnh. | Giúp trace luồng đi của lệnh qua Go, Rust, Broker, và DB. |
| `GET` | `/api/v1/orders/{order_id}/reconciliation` | Kết quả đối soát lệnh gần nhất. | Xác nhận trạng thái lệnh nội bộ có khớp với trạng thái ghi nhận tại broker hay không. |
| `POST` | `/api/v1/admin/orders/{order_id}/reconcile` | Kích hoạt đối soát lệnh thủ công (Admin-only). | Giúp đội vận hành sửa lỗi trạng thái lệnh sau sự cố kết nối broker/API. |
| `GET` | `/api/v1/audit/events` | Luồng sự kiện kiểm toán có thể tìm kiếm. | Phục vụ kiểm tra tuân thủ đối với các hành động đọc/ghi nhạy cảm. |
| `GET` | `/api/v1/audit/events/{id}` | Chi tiết một sự kiện kiểm toán. | Hiển thị thông tin: ai làm gì, khi nào, từ thiết bị/session nào, kèm correlation ID. |
| `GET` | `/api/v1/broker/status` | Trạng thái kết nối broker và account-mode chuẩn hóa. | Giúp phân biệt lỗi ứng dụng nội bộ với lỗi suy giảm dịch vụ từ phía đối tác broker. |
| `GET` | `/api/v1/broker/events` | Luồng sự kiện từ provider đã được chuẩn hóa. | Phục vụ điều tra sự cố broker mà không cần exposing trực tiếp các raw webhook của đối tác. |
| `GET` | `/api/v1/broker/reconciliation` | Tóm tắt đối soát với broker trên toàn bộ orders, fills, positions, và cash. | Kiểm chứng nguồn dữ liệu tin cậy của hệ thống có khớp hoàn toàn với broker hay không. |

---

### 2.9 Alerts (4 REST Endpoints)

Cho phép người dùng và quản trị viên thiết lập, quản lý các quy tắc cảnh báo.

| Method | Endpoint | Purpose | Client meaning |
|---|---|---|---|
| `GET` | `/api/v1/alerts` | Danh sách quy tắc cảnh báo của user và hệ thống. | Giúp người dùng quản lý cảnh báo giá, hiệu năng portfolio, rủi ro và vận hành. |
| `POST` | `/api/v1/alerts` | Tạo mới một quy tắc cảnh báo. | Định nghĩa ngưỡng giá, P/L, mức exposure, hoặc loại sự kiện cần nhận cảnh báo. |
| `PATCH` | `/api/v1/alerts/{id}` | Cập nhật cấu hình hoặc bật/tắt quy tắc cảnh báo. | Cho phép user thay đổi ngưỡng kích hoạt mà không cần xóa đi tạo lại cảnh báo. |
| `DELETE` | `/api/v1/alerts/{id}` | Xóa hoặc lưu trữ quy tắc cảnh báo. | Loại bỏ các cảnh báo không còn nhu cầu sử dụng để tránh nhiễu thông tin. |

---

### 2.10 Notifications, Feature Flags, and Runtime Config (10 REST Endpoints)

Cung cấp dịch vụ gửi thông tin (notifications) tới user và quản lý tính năng/cấu hình runtime cho quản trị viên.

| Method | Endpoint | Purpose | Client meaning |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | Danh sách thông báo trong ứng dụng (in-app notifications). | Hiển thị thông báo về khớp lệnh, sự cố hệ thống, cảnh báo giá, hoặc phê duyệt chiến thuật. |
| `PATCH` | `/api/v1/notifications/{notification_id}/read` | Đánh dấu thông báo đã đọc. | Cập nhật số lượng tin nhắn chưa đọc và huy hiệu (badge) trên mobile UI. |
| `GET` | `/api/v1/notification-preferences` | Đọc cấu hình nhận thông báo của user. | Hiển thị các kênh nhận tin (push, email, SMS, in-app) theo từng loại sự kiện. |
| `PATCH` | `/api/v1/notification-preferences` | Cập nhật cấu hình nhận thông báo. | Cho phép user tắt bớt tin nhắn rác mà không bỏ lỡ các cảnh báo rủi ro quan trọng. |
| `GET` | `/api/v1/admin/feature-flags` | Danh sách feature flags và trạng thái triển khai (Admin-only). | Xem các tính năng như paper trading, live trading, Strategy Lab có đang được bật không. |
| `POST` | `/api/v1/admin/feature-flags` | Tạo mới feature flag (Admin-only). | Thêm cờ bật/tắt tính năng có kiểm soát kèm thông tin owner, scope, default, và audit trail. |
| `PATCH` | `/api/v1/admin/feature-flags/{flag_id}` | Cập nhật quy tắc feature flag (Admin-only). | Triển khai tính năng theo user, tài khoản, khu vực, broker, thiết bị, hoặc tỷ lệ %. |
| `GET` | `/api/v1/admin/config` | Cấu hình runtime đang có hiệu lực (Admin-only). | Xem cấu hình rủi ro hoạt động, thông tin kết nối broker, cấu hình DSL và notification. |
| `POST` | `/api/v1/admin/config/versions` | Tạo một phiên bản cấu hình mới (Admin-only). | Đưa cấu hình mới vào trạng thái staging chuẩn bị kích hoạt mà chưa ảnh hưởng tới live engine. |
| `POST` | `/api/v1/admin/config/versions/{version_id}/activate` | Kích hoạt phiên bản cấu hình (Admin-only). | Áp dụng cấu hình mới kèm audit trail, thông tin rollback và cơ chế xóa cache. |

---

### 2.11 Strategy Lab (10 REST Endpoints)

Cung cấp công cụ cho phép người dùng tùy biến trọng số chỉ báo (weights), công thức toán học (formulas) và bộ lọc rủi ro của chiến thuật. Go quản lý contract và luồng phê duyệt; Python chạy backtest; Rust thực thi lệnh.

| Method | Endpoint | Purpose | Client meaning |
|---|---|---|---|
| `GET` | `/api/v1/strategy/templates` | Danh sách các strategy templates tích hợp sẵn. | Cấp các mẫu chiến thuật chuẩn: momentum, mean reversion, breakout, trend, hoặc risk-off. |
| `GET` | `/api/v1/strategies` | Danh sách bản nháp (drafts) và các phiên bản chiến thuật của user. | Hiển thị các chiến thuật nháp, chiến thuật đang chạy paper, và chiến thuật đủ điều kiện chạy live. |
| `POST` | `/api/v1/strategies` | Tạo một bản nháp chiến thuật mới. | Khởi tạo chiến thuật kèm công thức, trọng số chỉ báo, universe giao dịch, và cấu hình rủi ro. |
| `GET` | `/api/v1/strategies/{strategy_id}` | Đọc chi tiết định nghĩa và cấu hình chiến thuật. | Mở màn hình soạn thảo hoặc hiển thị chi tiết chiến thuật. |
| `PATCH` | `/api/v1/strategies/{strategy_id}` | Cập nhật cấu hình bản nháp (draft). | Cho phép chỉnh sửa thông số bản nháp mà không ảnh hưởng tới các phiên bản đã đóng băng (frozen versions). |
| `DELETE` | `/api/v1/strategies/{strategy_id}` | Lưu trữ (archive) chiến thuật. | Loại bỏ các chiến thuật không hiệu quả hoặc bị bỏ hoang khỏi danh sách hoạt động. |
| `POST` | `/api/v1/strategies/{strategy_id}/clone` | Tạo bản sao (fork) của một template hoặc chiến thuật hiện có. | Cho phép thử nghiệm ý tưởng mới dựa trên nền tảng cũ mà không làm hỏng cấu hình gốc. |
| `POST` | `/api/v1/strategies/{strategy_id}/validate` | Kiểm tra cú pháp, hỗ trợ chỉ báo, dữ liệu yêu cầu và biên rủi ro. | Trả về phản hồi tức thì về tính đúng đắn của chiến thuật trước khi chạy backtest hoặc paper. |
| `GET` | `/api/v1/strategies/{strategy_id}/versions` | Danh sách các phiên bản bất biến (immutable versions). | Xem chi tiết lịch sử các phiên bản chiến thuật cụ thể đã được kiểm thử hoặc đề xuất. |
| `POST` | `/api/v1/strategies/{strategy_id}/versions` | Đóng băng bản nháp thành phiên bản bất biến. | Tạo một version cố định phục vụ backtest, paper trading và quy trình phê duyệt kiểm toán. |

#### Nguyên tắc an toàn của Strategy Lab:
* Công thức được định nghĩa dưới dạng khai báo (declarative) và có số phiên bản rõ ràng.
* Các chỉ báo, toán tử, cửa sổ dữ liệu lịch sử (lookback windows) được allowlist tại phía server.
* Trọng số chỉ báo (weights) bắt buộc phải nằm trong giới hạn min/max cấu hình trước.
* Chiến thuật không thể giao dịch live nếu phiên bản immutable của nó chưa vượt qua: kiểm tra cú pháp (validation), bằng chứng backtest (backtest evidence), bằng chứng paper trading (paper session evidence), risk review, và live promotion approval.

---

### 2.12 Backtests and Evaluation (6 REST Endpoints)

| Method | Endpoint | Purpose | Client meaning |
|---|---|---|---|
| `POST` | `/api/v1/strategies/{strategy_id}/backtests` | Kích hoạt chạy backtest lịch sử cho một phiên bản immutable. | Đánh giá hiệu năng chiến thuật dựa trên dữ liệu quá khứ trước khi đưa vào paper trading. |
| `GET` | `/api/v1/backtests` | Danh sách lịch sử các lượt chạy backtest. | Hiển thị các lượt chạy đang xử lý, đã hoàn thành, bị lỗi, hoặc có thể so sánh. |
| `GET` | `/api/v1/backtests/{backtest_id}` | Xem tóm tắt kết quả backtest và file artifacts liên quan. | Hiển thị hiệu suất, max drawdown, win rate, tổng số lệnh và các metrics độ ổn định. |
| `POST` | `/api/v1/backtests/compare` | So sánh trực quan giữa nhiều lượt backtest hoặc phiên bản chiến thuật. | Giúp người dùng lựa chọn chiến thuật tối ưu nhất dựa trên các chỉ số định lượng. |
| `GET` | `/api/v1/backtests/{backtest_id}/signals` | Nhật ký tín hiệu (signals trace) của backtest. | Giúp kiểm tra lý do chiến thuật ra quyết định mua, bán, hoặc đứng ngoài ở từng thời điểm. |
| `GET` | `/api/v1/backtests/{backtest_id}/trades` | Danh sách lệnh khớp giả định trong quá trình backtest. | Giúp phân tích chi tiết các lệnh thua lỗ, các giai đoạn thị trường biến động và tránh overfitting. |

---

### 2.13 Paper Research Sessions (9 REST Endpoints)

| Method | Endpoint | Purpose | Client meaning |
|---|---|---|---|
| `GET` | `/api/v1/paper/sessions` | Danh sách các paper research sessions. | Thống kê các phiên thử nghiệm theo chiến thuật, thời gian chạy, trạng thái và hiệu năng. |
| `POST` | `/api/v1/paper/sessions` | Bắt đầu một session paper trading từ một phiên bản immutable. | Thử nghiệm thực tế chiến thuật với nguồn dữ liệu live giả định, dùng universe và risk riêng. |
| `GET` | `/api/v1/paper/sessions/{session_id}` | Đọc trạng thái hiện tại của paper session. | Cho biết session đang chạy (running), tạm dừng (paused), dừng hẳn (stopped) hay đã xong. |
| `POST` | `/api/v1/paper/sessions/{session_id}/pause` | Tạm dừng paper session. | Chặn việc phát sinh lệnh paper trading mới nhưng vẫn giữ nguyên trạng thái session. |
| `POST` | `/api/v1/paper/sessions/{session_id}/resume` | Tiếp tục chạy lại paper session đã tạm dừng. | Cho phép chiến thuật tiếp tục hoạt động trở lại sau khi xem xét hoặc mở cửa thị trường. |
| `POST` | `/api/v1/paper/sessions/{session_id}/stop` | Dừng hẳn paper session. | Kết thúc phiên thử nghiệm, tính toán tổng hợp kết quả cuối cùng và khóa các hành động lệnh. |
| `GET` | `/api/v1/paper/sessions/{session_id}/performance` | Các chỉ số đo lường hiệu năng của paper session. | Xem các metrics thực tế: P/L, drawdown, volatility, win rate, độ trượt giá (slippage). |
| `GET` | `/api/v1/paper/sessions/{session_id}/signals` | Nhật ký tín hiệu của paper session. | Giải thích quyết định vào/ra lệnh dựa trên dữ liệu stream thực tế của session. |
| `GET` | `/api/v1/paper/sessions/{session_id}/orders` | Lịch sử đặt lệnh của paper session. | Xem nhật ký vòng đời lệnh giả định và chất lượng khớp lệnh của chiến thuật trong session. |

---

### 2.14 Strategy Promotion Governance (8 REST Endpoints)

Quản lý kiểm soát quyền hạn (governance) đưa chiến thuật từ thử nghiệm lên chạy Live.

| Method | Endpoint | Purpose | Client meaning |
|---|---|---|---|
| `GET` | `/api/v1/strategies/{strategy_id}/stability-report` | Tóm tắt báo cáo độ ổn định từ dữ liệu backtest và paper trading. | Đưa ra đánh giá định lượng xem chiến thuật có đủ ổn định để đưa lên live hay không. |
| `GET` | `/api/v1/strategies/{strategy_id}/promotion-check` | Kiểm tra điều kiện cần của các cổng phê duyệt (gates). | Hiển thị các tiêu chí còn thiếu, các cảnh báo rủi ro hoặc rào cản phê duyệt hiện tại. |
| `POST` | `/api/v1/strategies/{strategy_id}/promote-paper` | Đánh dấu chiến thuật đủ điều kiện chạy Paper Trading. | Đưa chiến thuật từ trạng thái thử nghiệm cục bộ lên danh sách được phép chạy paper. |
| `POST` | `/api/v1/strategies/{strategy_id}/request-live-approval` | Yêu cầu phê duyệt chạy Live Trading. | Khởi tạo quy trình phê duyệt có lưu vết kiểm toán; tuyệt đối không tự động kích hoạt live. |
| `GET` | `/api/v1/strategy-deployments` | Danh sách lịch sử triển khai thực tế của các chiến thuật. | Xem chiến thuật nào đang thực sự được gán chạy Paper hoặc Live trên hệ thống. |
| `POST` | `/api/v1/strategy-deployments` | Triển khai kích hoạt một phiên bản chiến thuật đã duyệt. | Bắt đầu chạy chiến thuật kèm các cấu hình phân bổ vốn (allocation), chế độ chạy và tài khoản. |
| `PATCH` | `/api/v1/strategy-deployments/{deployment_id}` | Điều chỉnh trạng thái hoặc tỷ lệ phân bổ vốn của lượt triển khai. | Tạm dừng, tiếp tục hoặc cấu hình lại vốn trong hạn mức mà không cần đổi công thức. |
| `DELETE` | `/api/v1/strategy-deployments/{deployment_id}` | Dừng hẳn lượt triển khai chiến thuật. | Gỡ bỏ chiến thuật khỏi trạng thái chạy live/paper nhưng vẫn giữ nguyên lịch sử kiểm toán. |

---

## 3. WebSocket v1 Contract

### Endpoint: `/ws/v1`

#### A. Client gửi yêu cầu Subscribe (JSON):
```json
{
  "type": "subscribe",
  "schema_version": "1.0",
  "request_id": "req_123",
  "session_id": "sess_...",
  "resume_token": "wsrt_...",
  "last_ack_sequence": 918272,
  "topics": ["market.ticker:AAPL", "orders", "fills", "risk.status"]
}
```

#### B. Server gửi dữ liệu Broadcast (JSON):
```json
{
  "type": "market.ticker",
  "schema_version": "1.0",
  "topic": "market.ticker:AAPL",
  "connection_id": "wsc_...",
  "session_id": "sess_...",
  "sequence": 918273,
  "timestamp": "2026-07-07T00:00:00Z",
  "correlation_id": "cid_...",
  "payload": {
    "symbol": "AAPL",
    "price": 182.50,
    "size": 100,
    "side": "buy"
  }
}
```

#### C. Các Topics bắt buộc phải hỗ trợ:
* `system.health`, `observability.metrics`
* `market.ticker:{symbol}`, `market.order_book:{symbol}`
* `portfolio.summary`, `portfolio.valuation`, `positions`, `pricing.marks:{symbol}`
* `orders`, `fills`
* `risk.status`, `incidents`, `alerts`, `notifications`
* `strategy.validation:{strategy_id}`, `strategy.runtime:{strategy_id}`
* `backtest.status:{backtest_id}`
* `paper.session:{session_id}`, `paper.performance:{session_id}`
* `promotion.status:{strategy_id}`

#### D. Yêu cầu hành vi của WebSocket Server (Go):
* Yêu cầu xác thực (Auth) ngay khi kết nối.
* Server tự động gán `connection_id` độc bản và map nó với `session_id` đã được xác thực.
* Hỗ trợ lưu trữ message offset và cơ chế báo nhận (ACK) từ client để cho phép truyền tải lại tin nhắn bị mất khi mất kết nối ngắn thông qua `resume_token`.

---

## 4. Thiết kế Database & Lưu trữ (Data and Storage Plan)

Cơ sở dữ liệu của dự án được phân chia thành 4 vai trò cụ thể:
1. **Postgres (OLTP Source of Truth)**: Lưu trữ các dữ liệu mang tính giao dịch, bảo mật và yêu cầu tính toàn vẹn cao (User, Session, Order, Fill, Audits, Idempotency).
2. **DuckDB (Analytics & Observability)**: Lưu trữ dữ liệu lớn phục vụ phân tích, log metrics lịch sử, và kết quả đầu ra của các đợt backtest.
3. **Redis (Cache & Coord)**: Lưu trữ cache tạm thời, quản lý fanout WebSocket, distributed locks, rate limiting và điều phối stream outbox.
4. **Durable Event Bus (NATS JetStream/Kafka/Redpanda)**: Đảm bảo truyền tải có thứ tự, cơ chế phát lại sự kiện (replay) và phục vụ việc build lại projection read models.

---

### 4.1 Danh sách 128 Logical Tables cần quản lý

Để đảm bảo hệ thống vận hành đúng kiến trúc dạng Production, schema cơ sở dữ liệu được chia nhỏ thành 128 bảng logic theo 6 nhóm miền nghiệp vụ:

#### Nhóm 1: Identity, Access, and Client Security (13 Tables)
* `api_clients`, `api_client_keys`, `api_client_scopes`
* `users`, `user_profiles`, `user_roles`
* `roles`, `role_permissions`
* `sessions`, `devices`, `device_sessions`, `refresh_tokens`, `idempotency_keys`

#### Nhóm 2: Broker Accounts and Portfolio State (14 Tables)
* `accounts`, `account_connections`, `account_snapshots`
* `portfolio_snapshots`, `portfolio_events`, `portfolio_valuations`
* `positions`, `position_events`, `position_lots`, `position_valuations`
* `cash_balances`, `cash_movements`, `account_permissions`

#### Nhóm 3: Products and Market Data (13 Tables)
* `products`, `product_aliases`, `market_sessions`
* `market_data_ticks`, `market_quotes`, `market_bars`
* `order_book_snapshots`, `mark_prices`, `fx_rates`
* `pricing_snapshots`, `valuation_runs`, `corporate_actions`

#### Nhóm 4: Orders, Routing, Execution, and Fills (12 Tables)
* `order_intents`, `order_previews`
* `orders`, `order_transitions`, `order_rejections`
* `order_routes`, `broker_orders`, `broker_order_events`
* `fills`, `trades`, `execution_quality`

#### Nhóm 5: Risk, Controls, and Safety (13 Tables)
* `risk_limits`, `risk_limit_versions`, `pre_trade_checks`
* `risk_decisions`, `risk_decision_inputs`, `intraday_risk_snapshots`
* `post_trade_reviews`, `exposure_snapshots`, `margin_checks`
* `stop_loss_triggers`, `circuit_breaker_events`, `kill_switch_events`

#### Nhóm 6: Events, Observability, and Operations (37 Tables)
* `event_streams`, `event_store`, `event_snapshots`, `event_schema_versions`
* `command_requests`, `command_results`
* `projection_offsets`, `projection_errors`, `read_model_versions`, `replay_jobs`
* `audit_events`, `alert_rules`, `alert_events`, `alert_deliveries`
* `provider_events`, `provider_event_errors`
* `outbox_events`, `inbox_events`
* `websocket_sessions`, `websocket_subscriptions`, `websocket_resume_tokens`, `websocket_ack_offsets`, `websocket_replay_windows`
* `notification_channels`, `notification_preferences`, `notification_templates`, `notification_events`
* `feature_flags`, `feature_flag_rules`, `feature_flag_evaluations`
* `config_sets`, `config_versions`, `config_change_events`
* `incidents`, `incident_updates`, `system_components`, `service_health_checks`
* `metric_samples`, `metric_rollups`

#### Nhóm 7: Research, Backtest, and Validation Evidence (29 Tables)
* `strategy_templates`, `strategies`, `strategy_drafts`, `strategy_versions`
* `strategy_formula_versions`, `strategy_weight_sets`, `strategy_universes`, `strategy_risk_profiles`
* `strategy_validation_runs`, `backtest_runs`, `backtest_artifacts`, `backtest_comparisons`
* `paper_sessions`, `paper_session_metrics`, `paper_session_signals`, `paper_session_orders`
* `signal_traces`, `risk_trace_fixtures`, `parity_check_runs`
* `strategy_stability_reports`, `strategy_promotion_requests`, `strategy_live_approvals`
* `strategy_deployments`, `strategy_activation_events`
* `strategy_runtime_instances`, `strategy_runtime_snapshots`, `strategy_runtime_checkpoints`, `strategy_runtime_locks`

---

### 4.2 Chi tiết cấu trúc một số bảng Core bắt buộc

#### Bảng `idempotency_keys` (Postgres OLTP)
Dùng để đảm bảo các yêu cầu thay đổi trạng thái (đặt lệnh, sửa, hủy) không bị thực thi lặp lại do lỗi network retry từ phía client.

* `key` (VARCHAR, Primary Key cùng `shard_key`)
* `user_id` (UUID, Shard Key)
* `endpoint` (VARCHAR)
* `request_hash` (VARCHAR)
* `status` (VARCHAR - e.g., 'locked', 'completed', 'failed')
* `response_status` (INTEGER)
* `response_body` (TEXT)
* `created_at` (TIMESTAMP WITH TIME ZONE)
* `expires_at` (TIMESTAMP WITH TIME ZONE)
* `locked_until` (TIMESTAMP WITH TIME ZONE)

#### Bảng `event_store` (Postgres OLTP - Lưu vết Event Sourcing)
Lưu trữ toàn bộ các thay đổi trạng thái gốc của hệ thống dưới dạng sự kiện (events).

* `event_id` (UUID, Primary Key)
* `stream_id` (VARCHAR)
* `aggregate_type` (VARCHAR)
* `aggregate_id` (VARCHAR)
* `aggregate_version` (BIGINT)
* `event_type` (VARCHAR)
* `event_version` (INTEGER)
* `schema_version` (VARCHAR)
* `command_id` (UUID)
* `causation_id` (UUID)
* `correlation_id` (UUID)
* `producer` (VARCHAR)
* `payload` (JSONB)
* `created_at` (TIMESTAMP WITH TIME ZONE)

#### Bảng `projection_offsets` (Postgres OLTP - Quản lý Read Models)
Lưu trữ vị trí đọc (offsets) hiện tại của các worker tiêu thụ sự kiện từ Event Store nhằm cập nhật các Read-Models/Projections.

* `projection_name` (VARCHAR, Primary Key)
* `consumer_group` (VARCHAR)
* `stream_id` (VARCHAR)
* `last_event_id` (UUID)
* `last_sequence` (BIGINT)
* `last_schema_version` (VARCHAR)
* `last_error` (TEXT)
* `rebuild_started_at` (TIMESTAMP WITH TIME ZONE NULL)
* `updated_at` (TIMESTAMP WITH TIME ZONE)

#### Ngữ nghĩa cấu trúc các bảng thuộc Strategy Lab
* `strategies`: Bảng gốc lưu thông tin định danh của ý tưởng/chiến thuật do user sở hữu. Không chứa logic động hoặc trạng thái thực thi.
* `strategy_drafts`: Bản lưu cấu hình nháp đang chỉnh sửa của user (chỉ báo, trọng số, công thức, universe, risk).
* `strategy_versions`: Khi user đóng băng (freeze) bản nháp, một dòng ghi dữ liệu bất biến sẽ được tạo ra tại đây. Mọi tác vụ như Backtest, Paper Session hay Live Promotion đều chỉ được phép tham chiếu tới `strategy_versions` bất biến này.
* `strategy_universes` & `strategy_risk_profiles`: Tách biệt danh sách symbol/khung thời gian giao dịch và hạn mức rủi ro ra khỏi công thức chiến thuật. Điều này giúp chạy thử nghiệm một công thức trên nhiều môi trường/symbol khác nhau mà không phải viết lại logic.
* `strategy_deployments`: Bản ghi liên kết chỉ rõ phiên bản chiến thuật cụ thể nào đang được kích hoạt chạy thực tế (Paper hay Live) trên tài khoản nào, với tỷ lệ phân bổ vốn là bao nhiêu.
* `strategy_runtime_instances`, `strategy_runtime_snapshots`, `strategy_runtime_checkpoints`: Lưu trạng thái bộ nhớ đệm, cooldowns, signal contexts của các engine chạy chiến thuật. Đảm bảo khi Go/Rust khởi động lại thì các chiến thuật đang chạy tự phục hồi trạng thái tức thì mà không bị mất dữ liệu.

---

### 4.3 Phân vùng (Partitioning) & Phân mảnh (Sharding)

#### A. Time-series Partitioning (Phân vùng theo thời gian)
Các bảng nhật ký log hoặc chuỗi thời gian dung lượng lớn bắt buộc phải phân vùng theo thời gian để tối ưu hóa hiệu năng truy vấn và dọn dẹp dữ liệu cũ.
* **Monthly Partitions (Hàng tháng)**: Áp dụng cho các bảng audit và log sự kiện vận hành: `audit_events`, `alert_events`, `provider_events`, `outbox_events`, `inbox_events`, `event_store`, `command_requests`, `command_results`, `service_health_checks`, `notification_events`, `feature_flag_evaluations`, `config_change_events`.
* **Daily Partitions (Hàng ngày)**: Áp dụng cho các bảng dữ liệu thị trường và metrics có tần suất ghi cực cao: `market_data_ticks`, `market_quotes`, `market_bars`, `order_book_snapshots`, `metric_samples`, `websocket_sessions`, `websocket_ack_offsets`, `websocket_replay_windows`, `trades`, `position_events`, `portfolio_events`, `mark_prices`, `pricing_snapshots`, `valuation_runs`, `pre_trade_checks`, `intraday_risk_snapshots`, `post_trade_reviews`, `backtest_runs`, `paper_session_signals`, `paper_session_orders`, `paper_session_metrics`, `strategy_activation_events`, `strategy_runtime_snapshots`, `strategy_runtime_checkpoints`.
* **Cơ chế lưu trữ**: Các phân vùng nóng (hot partitions) hoạt động được lưu trực tiếp trên Postgres để đảm bảo tốc độ đọc ghi. Phân vùng lạnh (cold analytical partitions) sẽ tự động lưu trữ nén sang DuckDB hoặc Object Storage.

#### B. Hash-sharding (Phân mảnh dữ liệu)
Khi tải ghi của cụm Postgres chính vượt ngưỡng, các bảng mang tính chất OLTP, phân mảnh theo người dùng hoặc tài khoản sẽ được Sharding theo Hash của khóa phân mảnh `account_id` hoặc `user_id`:
* **Danh sách bảng Sharded**: `orders`, `fills`, `positions`, `portfolio_snapshots`, `risk_decisions`, `idempotency_keys`, `audit_events`, `event_streams`, `strategies`, `strategy_versions`, `paper_sessions`, `strategy_deployments`, `strategy_runtime_instances`, `alert_rules`.
* **Shard Resolver**: Toàn bộ luồng ghi (writes) của các bảng sharded bắt buộc phải đi qua Go API Gateway để xử lý định tuyến mảnh ghi (shard resolver). Rust chỉ xuất bản canonical events lên event bus; Python chỉ đọc phục vụ phân tích mà không ghi trực tiếp vào OLTP.
* **Ràng buộc khóa**: Mỗi bảng sharded phải chứa khóa phân mảnh rõ ràng (`account_id` hoặc `user_id`) như một phần của Primary Key hoặc Unique Key (ví dụ unique key của `idempotency_keys` là `(shard_key, key)`).

#### C. Global Reference Tables (Bảng tham chiếu toàn cục)
Các bảng cấu hình toàn hệ thống, có lượng dữ liệu nhỏ, tần suất đọc cao và ít thay đổi sẽ được duy trì không sharding (Unsharded) trên tất cả các cụm cơ sở dữ liệu:
* **Danh sách bảng**: `products`, `product_aliases`, `market_sessions`, `roles`, `role_permissions`, `risk_limit_versions`.

---

## 5. Đề xuất Kiến trúc & Bộ Package (Tech Stack Recommendations)

Dựa trên yêu cầu kiến trúc và quy mô của Blueprint, dưới đây là đề xuất chi tiết về bộ thư viện và công cụ được tối ưu hóa cho Go Observability Gateway:

### 5.1 Phân bổ Công nghệ & Package
| Thành phần | Công nghệ / Package | Ghi chú |
| :--- | :--- | :--- |
| **HTTP API** | `github.com/gin-gonic/gin` | Engine chính cho HTTP API Gateway |
| **PostgreSQL** | `gorm.io/gorm` + `github.com/sqlc-dev/sqlc` + `github.com/jackc/pgx/v5` | Hybrid: GORM cho CRUD/Admin, SQLC/pgx cho Core Trading |
| **DuckDB** | `database/sql` + `github.com/marcboeker/go-duckdb` | Sử dụng Raw SQL trực tiếp cho OLAP / Analytics |
| **Migration** | **Atlas** (`ariga.io/atlas`) | Quản lý schema diff, linting, drift detection & partitioning |
| **Redis** | `github.com/redis/go-redis/v9` | Dùng cho cache, rate limit và duy trì session WebSocket |
| **Event Bus** | `github.com/nats-io/nats.go` | Kết nối NATS JetStream phục vụ pub/sub event-driven |
| **OpenAPI** | `github.com/oapi-codegen/oapi-codegen/v2` | Khởi tạo boilerplate & type-safe code từ spec OpenAPI 3.1 |
| **Validation** | `github.com/go-playground/validator/v10` | Xác thực dữ liệu đầu vào |
| **Logging** | `slog` (standard library) hoặc `zap` | Logger có cấu trúc hiệu năng cao |
| **Observability** | `go.opentelemetry.io/otel` + `github.com/prometheus/client_golang` | Thu thập metrics và phân phối trace |
| **Auth / JWT** | `github.com/golang-jwt/jwt/v5` | Quản lý ký và xác thực JSON Web Token |

### 5.2 Khuyến nghị Kiến trúc Dữ liệu (PostgreSQL Hybrid Strategy)

Để đáp ứng 128 logical tables và tối ưu hóa hiệu năng giữa hai luồng đọc-ghi (OLTP vs CRUD), kiến trúc PostgreSQL sẽ được chia làm hai phân hệ:

1. **Sử dụng GORM (CRUD & Configuration Management)**:
   * **Bảng áp dụng**: `users`, `sessions`, `devices`, `watchlists`, `strategies`, `notifications`, `feature flags`, `config`.
   * **Đặc điểm**: Tần suất ghi trung bình/thấp, nghiệp vụ CRUD phức tạp, dễ dàng tận dụng các tính năng ORM để phát triển nhanh. GORM chỉ mirror model theo cấu hình thực tế được định nghĩa từ migration.

2. **Sử dụng SQLC + PGX (Core Trading & High-Performance Hot Paths)**:
   * **Bảng áp dụng**: `orders`, `fills`, `positions`, `idempotency_keys`, `event_store`, `projection_offsets`, `audit_events`, `risk_decisions`.
   * **Đặc điểm**: Tần suất giao dịch cực cao, yêu cầu độ trễ thấp và kiểm soát chặt chẽ các câu lệnh SQL, locking, transactions, và cơ chế idempotency. SQLC sinh ra code Go type-safe trực tiếp từ các file `.sql` thuần túy, kết hợp với driver hiệu năng cao `pgx`.

### 5.3 Chiến lược Quản lý Schema Migration qua Atlas

Thay vì dùng ORM tự động sinh schema hoặc sử dụng các công cụ migrate truyền thống, **Atlas** được chọn làm công cụ quản lý Migration tập trung:
* **Schema Source of Truth**: Toàn bộ định nghĩa schema nằm trong các file khai báo Atlas (HCL hoặc SQL migrations), không dựa vào cơ chế `AutoMigrate` của GORM để tránh sai lệch cấu trúc dữ liệu môi trường Production.
* **Lợi ích**:
  * Hỗ trợ quản lý phân vùng dữ liệu động (Dynamic Partitioning) hàng ngày/hàng tháng.
  * Tự động phát hiện sai lệch schema thực tế so với thiết kế (Drift Detection).
  * Tích hợp CI/CD để tự động hóa kiểm tra (Migration Linting) trước khi triển khai lên Production.
