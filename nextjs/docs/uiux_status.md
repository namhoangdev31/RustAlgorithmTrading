# Trạng thái UI/UX Next.js

Đánh giá lần cuối: `2026-06-22`
Phạm vi: Thư mục `nextjs/` duy nhất. Đây là tài liệu chuẩn hóa về trạng thái giao diện người dùng (UI/UX) của Lepos, thay thế các phần giao diện của `status_report.md` và kế hoạch xử lý khoảng cách tính năng trong `feature_gap_resolution_plan.md`.

## Cách đọc trạng thái giao diện (UI status)

| Trạng thái | Ý nghĩa | Quy tắc lập kế hoạch |
|---|---|---|
| `Complete flow` | Trang/panel tồn tại đầy đủ, sử dụng dữ liệu/actions thật của `nextjs` và cung cấp luồng công việc rõ ràng cho người dùng. | Tối ưu hóa và kết nối các màn hình liên quan. |
| `Usable beta` | Giao diện đã tồn tại và sử dụng được, nhưng cần cải tiến các trạng thái lỗi/trống, hiển thị bằng chứng dữ liệu hoặc hướng dẫn chi tiết. | Nâng cấp giao diện hiện tại. |
| `Operational shell` | Giao diện điều khiển một hợp đồng dữ liệu thật, nhưng dữ liệu trực tiếp phụ thuộc vào gateway, bridge, provider hoặc backend. | Bổ dung bằng chứng và trạng thái chạy thực tế (runtime) trước khi thêm nút điều khiển. |
| `Simulator / prototype` | Màn hình hữu ích cho việc thiết kế/phát triển, nhưng các nhãn cảnh báo hoặc hành động chính vẫn dựa vào dữ liệu mô phỏng. | Sửa lại nội dung cảnh báo và thay thế dữ liệu mô phỏng bằng kết nối thật trước khi phát hành. |
| `Missing` | Chưa có trang hoặc giao diện điều khiển nào được xây dựng. | Thiết lập hợp đồng dữ liệu trước khi xây dựng giao diện. |

*Giải nghĩa thuật ngữ:*
- **SSL (Secure Sockets Layer):** Chứng chỉ bảo mật mã hóa kết nối ứng dụng Web.
- **SCIM (System for Cross-domain Identity Management):** Giao thức đồng bộ tài khoản người dùng tự động.
- **WAF (Web Application Firewall):** Tường lửa ứng dụng Web bảo vệ an ninh lưu lượng.
- **mTLS (Mutual TLS):** Chứng chỉ bảo mật xác thực mã hóa kênh truyền song phương (hai chiều).
- **GA (General Availability):** Trạng thái phát hành chính thức rộng rãi.
- **SIEM (Security Information and Event Management):** Quản lý sự kiện và an ninh thông tin tập trung.
- **CRUD (Create, Read, Update, Delete):** Các thao tác dữ liệu cơ bản (Thêm, Đọc, Sửa, Xóa).

## Ma trận các nhóm giao diện (U01 - U20)

| ID | Nhóm UI/UX | Các trang/views chính | Trạng thái hiện tại | Việc cần làm tiếp theo |
|---|---|---|---|---|
| `U01` | Trang công cộng, auth, tài liệu | Trang chủ, tài liệu, login/register | `Complete flow` | Giữ ổn định; duy trì cấu trúc tài liệu. |
| `U02` | Khung dashboard và cài đặt | Tổng quan dashboard, cài đặt tài khoản | `Complete flow` | Tăng cường liên kết chéo và tóm tắt. |
| `U03` | Quản lý dự án & Deployments | Chi tiết dự án, tab triển khai, logs | `Product-ready` | Thêm quy trình môi trường xem trước Git/PR. |
| `U04` | Tên miền & Edge cache | Cài đặt tên miền, xóa bộ đệm cache | `Product-ready` | Loại bỏ các cơ chế native simulator dự phòng. |
| `U05` | Giám sát & gỡ lỗi | Chi tiết lỗi, error tracker, source maps | `Product-ready` | Xây dựng trình xem logs trung tâm tổng hợp. |
| `U06` | Quản trị doanh nghiệp, SCIM | Nhật ký kiểm toán, cấu hình SCIM | `Usable beta` | Quản lý trạng thái nhà cung cấp SCIM thật. |
| `U07` | Chợ ứng dụng đối tác | Console nhà phát triển đối tác, payout | `Complete flow / Usable beta`| Hoàn thiện đối soát doanh thu, QA đối tác. |
| `U08` | Thiết bị cục bộ và WAF | Connected devices, bản đồ đe dọa WAF | `Beta` | Giám sát logs gateway thật; WAF rules version. |
| `U09` | Vận hành nâng cao | Tab định tuyến, mirrors, khắc phục lỗi | `Product-ready` | Hoàn thiện các bảng con sub-sidebar native. |
| `U10` | Zero-trust & Telemetry | Danh tính dịch vụ, CA managed widget | `Beta` | Bổ sung cảnh báo hết hạn chứng chỉ Client thật. |
| `U11` | Log Drains | Tab cấu hình log drains, Datadog/Syslog | `Complete flow` | Hỗ trợ thêm các nhà cung cấp logs cloud lớn. |
| `U12` | DNS Records | Tab quản lý bản ghi DNS, bộ lọc loại | `Complete flow` | Validate định dạng IP đầu vào cho bản ghi. |
| `U13` | Domain Registrar | Tab tìm kiếm, báo giá và mua tên miền | `Complete flow` | Đồng bộ thanh toán giỏ hàng qua tài khoản. |
| `U14` | Edge Config Editor | Tab soạn thảo biến JSON Edge Config | `Complete flow` | Cải tiến giao diện Editor nâng cao có syntax check. |
| `U15` | Edge Config Schema | Tab định nghĩa schema cho store | `Complete flow` | Validate cấu hình tự động trước khi lưu store. |
| `U16` | Edge Config Backups | Tab danh sách sao lưu store và rollback | `Complete flow` | So sánh trực quan (diff) giữa các bản sao lưu. |
| `U17` | Access Groups | Tab danh sách nhóm, dự án liên kết | `Complete flow` | Đồng bộ hóa quyền hạn thành viên trực quan. |
| `U18` | Account Aliases | Tab danh sách alias độc lập của tài khoản | `Complete flow` | Gán alias nhanh từ chi tiết deployment. |
| `U19` | Integrations | Tab các Add-ons bên thứ ba đã cài đặt | `Complete flow` | Tích hợp sâu cài đặt cấu hình add-on. |
| `U20` | Webhooks Manager | Tab đăng ký và quản lý webhooks sự kiện | `Complete flow` | Hỗ trợ kiểm thử gửi thử payload (test ping payload). |

## Danh mục giao diện theo nhóm quản trị (U01 - U20)

| Nhóm quản trị | Danh mục các trang/views | Giữ, cải tiến, hay viết lại |
|---|---|---|
| `U01` | Trang chủ marketing, tài liệu hướng dẫn, login/register | `Giữ`. Không viết lại từ đầu. |
| `U02` | Tổng quan dashboard, cài đặt tài khoản, hiển thị, thông báo | `Giữ`. Cải tiến điều hướng và tóm tắt. |
| `U03` | Chi tiết dự án, tab triển khai, thăng cấp, logs | `Product-ready`. Thêm quy trình Git/PR previews. |
| `U04` | Cài đặt tên miền, chứng chỉ SSL, Edge cache purges | `Product-ready`. Kết nối Vercel SDK registrar/dns/certs. |
| `U05` | Chi tiết lỗi, error tracker, crash panel, source maps | `Product-ready`. Error Tracker liên kết trực tiếp log. |
| `U06` | Nhật ký kiểm toán không gian làm việc, cấu hình SCIM | `Cải tiến`. SCIM được gắn nhãn Simulator rõ ràng. |
| `U07` | Console đối tác chợ ứng dụng, payout, billing | `Giữ/Cải tiến`. Khung cơ bản đã hoàn thiện tốt. |
| `U08` | Connected devices, bản đồ đe dọa WAF, WAF sensitivity | `Cải tiến`. Nhịp tim hoạt động chứng tỏ kết nối. |
| `U09` | Định tuyến liên kết, mirrors, remediation, FinOps panels | `Product-ready`. NativePlatformTab chia nhỏ thành sub-tabs. |
| `U10` | Zero-trust telemetry, mTLS trust policies, CA manager | `Beta`. CA certs và nút xoay vòng khóa mô phỏng. |
| `U11` | CRUD Log Drains ngoài (Datadog, Syslog, HTTPS endpoints)| `Product-ready`. Quản lý và cấu hình log drains. |
| `U12` | CRUD bản ghi DNS trực quan | `Product-ready`. Tạo và xóa bản ghi DNS của tên miền. |
| `U13` | Biểu mẫu tìm kiếm và mua tên miền trực tiếp qua Vercel | `Product-ready`. Hỗ trợ mua tên miền trực tiếp qua API. |
| `U14` | Trình soạn thảo biến JSON Edge Config | `Product-ready`. Chỉnh sửa biến cấu hình store. |
| `U15` | Giao diện validate schema JSON của Config Store | `Product-ready`. Thiết lập cấu trúc dữ liệu bắt buộc. |
| `U16` | Lịch sử sao lưu Edge Config Store và nút Rollback | `Product-ready`. Khôi phục trạng thái biến cấu hình. |
| `U17` | CRUD Access Groups và gán dự án/thành viên | `Product-ready`. Quản lý nhóm truy cập cấp Enterprise. |
| `U18` | Danh sách domain aliases của tài khoản Vercel | `Product-ready`. Liên kết tên miền phụ vào dự án. |
| `U19` | Danh sách tích hợp Add-ons bên thứ ba đã kết nối | `Product-ready`. Quản lý các dịch vụ add-on bổ sung. |
| `U20` | CRUD Webhooks nhận sự kiện thay đổi deploy của Vercel | `Product-ready`. Liên kết URL gọi lại khi hoàn thành deploy. |

## Nhật ký giao diện ưu tiên (UI Backlog)

### P0: Tránh gây hiểu lầm cho người dùng (Prevent misleading UX)

- `[x]` Thêm trạng thái `simulated` hoặc `sandbox` rõ ràng cho SSL Certs (`CertsTab.tsx`) và SCIM settings (`scim-settings-client.tsx`).
- `[x]` Thêm trạng thái mô phỏng rõ ràng cho zero-trust mTLS/CA flows (`zero-trust-telemetry-panel.tsx`).
- `[x]` Bổ sung nhịp tim động (pulsing green active heartbeats) chứng tỏ độ tin cậy kết nối cho WAF, Connected Devices và Federated Routing.
- `[ ]` Thêm bằng chứng dữ liệu cho các bảng định tuyến.
- `[x]` Cập nhật các tiêu đề/mô tả để các bảng điều khiển Simulator không viết như thể tính năng chạy thực tế (GA).

### P1: Làm cho quy trình vận hành dễ sử dụng hơn

- `[x]` Chia nhỏ NativePlatformTab quá tải thành các tab quy trình chuyên biệt (Routing, Mirrors, Remediation, FinOps) sử dụng thanh điều hướng bên.
- `[x]` Tạo liên kết chéo giữa Error Tracker với nhật trình logs của Vercel/native để người dùng dễ gỡ lỗi nhanh (`error-tracker-client.tsx`).
- `[x]` Tích hợp cấu phần dòng thời gian sự cố thống nhất (Incident Timeline) hiển thị chặn WAF, failover, đồng bộ gương, và tự động sửa lỗi.

### P2: Đánh bóng sản phẩm hoàn thiện

- Tối ưu hóa các trạng thái trống/lỗi/đang tải của các panels Native Platform.
- Bổ sung hướng dẫn cài đặt từng bước (setup wizards) cho các tính năng kết nối bên thứ ba: SCIM, ACME/DNS, IPFS/Arweave, chứng chỉ CA.
- Điều chỉnh nội dung văn bản (copy) phù hợp cho từng phân quyền tài khoản (operator vs developer vs partner).

## Quy tắc duy trì tài liệu

1. Theo dõi tiến độ giao diện theo mã nhóm `Uxx` và ánh xạ ngược lại nhóm tính năng `Fxx`.
2. Không đánh dấu giao diện là `Complete flow` nếu luồng công việc chính vẫn đang sử dụng dữ liệu mô phỏng hoặc thiếu kết nối thật.
3. Ưu tiên nâng cấp, tối ưu hóa các giao diện màn hình hiện tại thay vì tạo trang mới, ngoại trừ trường hợp trang cũ bị quá tải thông tin.
4. Khi giao diện tồn tại nhưng thiếu bằng chứng kết nối thật, đánh dấu là `Usable beta` hoặc `Operational shell`, không ghi là `Complete/Shipped`.
