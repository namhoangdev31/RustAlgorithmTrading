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

## Kế hoạch nâng cấp giao diện 5 giai đoạn

Dưới đây là kế hoạch phân chia lộ trình nâng cấp giao diện người dùng Lepos thành 5 giai đoạn rõ ràng, tập trung giải quyết triệt để các khoảng cách tính năng và việc cần làm tiếp theo được chỉ ra trong ma trận U01 - U20:

### Giai đoạn 1: Chuẩn hóa & Ổn định Nền tảng cốt lõi (Core Portal & Workspace)
*Tập trung vào các nhóm: `U01`, `U02`, `U17`, `U18`*
- **Mục tiêu**: Đảm bảo trải nghiệm quản lý không gian làm việc cơ bản luôn mượt mà và dễ điều hướng.
- **Nhiệm vụ cụ thể**:
  - Tối ưu hóa hiệu năng tải trang và render của trang chủ marketing (`U01`).
  - Xây dựng cấu trúc tài liệu hướng dẫn sử dụng trực tuyến với phân loại rõ ràng (`U01`).
  - Làm mượt quy trình Login/Register và xử lý lỗi xác thực (`U01`).
  - Tối ưu hóa hiệu năng tải của trang tổng quan dashboard (`U02`).
  - Tinh chỉnh giao diện cài đặt tài khoản cá nhân và thông báo (`U02`).
  - Tích hợp thanh breadcrumbs giúp điều hướng nhanh giữa các dự án (`U02`).
  - Xây dựng trạng thái tải (Loading skeleton/spinners) đồng bộ trên toàn portal (`U02`).
  - Thiết lập hộp thoại xác nhận an toàn (Dialog overlay) khi xóa hoặc chuyển giao dự án (`U02`).
  - Đồng bộ quyền hạn thành viên trực quan trong quản lý Nhóm truy cập (Access Groups - `U17`).
  - Tích hợp tính năng gán alias nhanh từ chi tiết deployment vào Danh sách alias tài khoản (`U18`).

### Giai đoạn 2: Tích hợp sâu & Làm mịn Luồng Vercel SDK
*Tập trung vào các nhóm: `U03`, `U04`, `U11`, `U12`, `U13`, `U19`, `U20`*
- **Mục tiêu**: Kết nối hoàn toàn các tác vụ quản lý domain, DNS, logs và webhook của Vercel SDK để loại bỏ các trạng thái giả lập.
- **Nhiệm vụ cụ thể**:
  - Thiết kế quy trình kéo-thả trực quan cấu hình deployment (`U03`).
  - Tích hợp giao diện quản lý và hiển thị môi trường xem trước (Git/PR preview environments) hoàn chỉnh (`U03`).
  - Loại bỏ hoàn toàn các simulator dự phòng trong cài đặt domain/SSL, kết nối trực tiếp với Vercel SDK DNS/Certs (`U04`).
  - Xây dựng giao diện cấu hình và quản lý Log Drains ngoài (Datadog, Syslog, HTTPS endpoints) (`U11`).
  - Mở rộng hỗ trợ cấu hình log drains cho các nhà cung cấp cloud lớn (`U11`).
  - Thiết lập bảng quản lý bản ghi DNS trực quan, hỗ trợ CRUD bản ghi (`U12`).
  - Hỗ trợ validate định dạng IP đầu vào cho các loại bản ghi DNS (`U12`).
  - Bổ sung tiến trình (spinner/indicator) đồng bộ DNS động khi cập nhật bản ghi (`U12`).
  - Xây dựng biểu mẫu tìm kiếm, báo giá và mua tên miền trực tiếp qua Vercel registrar (`U13`).
  - Tích hợp giỏ hàng thanh toán mua tên miền liên kết tài khoản (`U13`).
  - Quản lý vòng đời gỡ cài đặt Add-ons/Integrations bên thứ ba (`U19`).
  - Bổ sung tính năng kiểm thử gửi thử payload (test ping) trong Webhooks Manager (`U20`).

### Giai đoạn 3: Tối ưu trải nghiệm DX & Trình soạn thảo Edge Config
*Tập trung vào các nhóm: `U05`, `U14`, `U15`, `U16`*
- **Mục tiêu**: Nâng cấp công cụ cấu hình động và hệ thống giám sát để mang lại trải nghiệm phát triển (DX) đẳng cấp cao.
- **Nhiệm vụ cụ thể**:
  - Phát triển trình xem logs trung tâm tổng hợp, liên kết chéo từ Error Tracker để người dùng gỡ lỗi nhanh chóng (`U05`).
  - Tích hợp cấu phần dòng thời gian sự cố (Incident Timeline) hiển thị chặn WAF, failover, đồng bộ gương (`U05`).
  - Cải tiến trình soạn thảo JSON cho Edge Config Editor tích hợp tính năng kiểm tra lỗi cú pháp thời gian thực (`U14`).
  - Hiển thị định dạng JSON đẹp (pretty-print) mặc định cho dữ liệu cấu hình thô (`U14`).
  - Hiển thị cảnh báo dữ liệu chưa lưu khi người dùng chuyển tab trong khi sửa Edge Config (`U14`).
  - Thiết lập luồng validate tự động cấu hình đối chiếu với JSON schema trước khi lưu store (`U15`).
  - Thêm tính năng tự động hoàn thành (autocomplete) cho các key cấu hình đã được định nghĩa trong schema (`U15`).
  - Bổ sung giao diện so sánh trực quan (diff visualizer) giữa các bản sao lưu Edge Config (`U16`).
  - Tích hợp tính năng rollback nhanh về bản sao lưu Edge Config trước đó (`U16`).
  - Xây dựng các gợi ý sửa lỗi trực tiếp trên giao diện khi schema cấu hình bị sai lệch (`U15`).

### Giai đoạn 4: Quản trị Doanh nghiệp & Vận hành Native nâng cao
*Tập trung vào các nhóm: `U06`, `U08`, `U09`*
- **Mục tiêu**: Đưa các tính năng quản trị quy mô lớn và WAF/Routing thoát khỏi trạng thái mô phỏng hoặc quá tải.
- **Nhiệm vụ cụ thể**:
  - Hoàn thiện giao diện đồng bộ SCIM, tích hợp hiển thị trạng thái của các nhà cung cấp SCIM thực tế (Okta, Azure AD,...) (`U06`).
  - Xây dựng bộ lọc tìm kiếm và phân loại nhật ký kiểm toán (audit logs) quy mô lớn (`U06`).
  - Nâng cấp bảng điều khiển Connected Devices, kết nối trực tiếp với nhịp tim (heartbeat) thật (`U08`).
  - Nâng cấp giao diện bản đồ đe dọa WAF, hiển thị dữ liệu sự kiện thật từ gateway (`U08`).
  - Quản lý phiên bản quy tắc WAF (WAF rules versioning) và điều chỉnh mức độ nhạy (`U08`).
  - Hiển thị biểu đồ thống kê tấn công WAF thời gian thực theo khu vực địa lý (`U08`).
  - Chia nhỏ NativePlatformTab quá tải thành các tab quy trình chuyên biệt (Routing, Mirrors, Remediation, FinOps) sử dụng thanh điều hướng bên (`U09`).
  - Hoàn thiện giao diện cấu hình định tuyến đa vùng, trạng thái drain và failover (`U09`).
  - Thiết lập bảng cấu hình lập lịch FinOps và thuật toán khuyến nghị tối ưu hóa chi phí/carbon (`U09`).
  - Tối ưu hóa các trạng thái trống/lỗi/đang tải của các panels Native Platform (`U09`).

### Giai đoạn 5: An ninh Zero-Trust & Chợ ứng dụng Marketplace
*Tập trung vào các nhóm: `U07`, `U10`*
- **Mục tiêu**: Thiết lập an ninh cấp cao và hoàn chỉnh hệ thống đối soát thương mại của Lepos.
- **Nhiệm vụ cụ thể**:
  - Hoàn thiện giao diện đối soát doanh thu thực tế, lịch sử thanh toán chợ ứng dụng (`U07`).
  - Xây dựng quy trình đăng ký, xét duyệt và kiểm duyệt (QA) đối tác phát triển chợ ứng dụng (`U07`).
  - Xây dựng trang thống kê doanh thu đối tác với các bộ lọc thời gian và xuất báo cáo CSV/PDF (`U07`).
  - Tích hợp biểu mẫu phản hồi và đánh giá ứng dụng trực tiếp trên Marketplace (`U07`).
  - Nâng cấp giao diện Zero-Trust Telemetry, tích hợp hệ thống cảnh báo tự động khi chứng chỉ Client mTLS thật sắp hết hạn (`U10`).
  - Thêm màn hình quản lý chứng chỉ CA cục bộ, cho phép tải lên và xem thông tin CA bundle (`U10`).
  - Hiển thị lịch sử hoạt động xoay vòng khóa (key rotation logs) trong tab CA Manager (`U10`).
  - Thiết lập các hướng dẫn cài đặt từng bước (setup wizards) cho luồng SCIM (`U06`).
  - Thiết lập các hướng dẫn cài đặt từng bước (setup wizards) cho luồng mua tên miền và thiết lập DNS (`U13/U12`).
  - Thiết lập các hướng dẫn cài đặt từng bước (setup wizards) cho luồng đăng ký chứng chỉ CA và mTLS (`U10`).

## Nhật ký giao diện ưu tiên (UI Backlog)

### Giai đoạn 1: Chuẩn hóa & Ổn định Nền tảng cốt lõi
- `[x]` Tối ưu hóa hiệu năng tải của trang chủ, trang quản lý và thanh điều hướng bên.
- `[x]` Tối ưu hóa điều hướng giữa các trang dự án chính thông qua breadcrumbs (`U02`).
- `[x]` Thêm trạng thái tải (Loading state) thống nhất cho toàn bộ các trang cấu hình cài đặt (`U02`).
- `[ ]` Đồng bộ quyền hạn thành viên trực quan trong quản lý Nhóm truy cập (`U17`).
- `[ ]` Tích hợp tính năng gán alias nhanh từ chi tiết deployment vào Danh sách alias tài khoản (`U18`).
- `[ ]` Hiển thị cảnh báo xác nhận khi xóa hoặc rời khỏi một không gian làm việc (`U02`).
- `[ ]` Tích hợp bộ lọc tìm kiếm nhanh dự án theo tên hoặc môi trường trên trang tổng quan (`U02`).
- `[ ]` Thêm phân quyền vai trò (Owner, Member, Viewer) hiển thị trực quan trong giao diện Access Groups (`U17`).

### Giai đoạn 2: Tích hợp sâu & Làm mịn Luồng Vercel SDK
- `[ ]` Xây dựng quy trình kéo-thả và hiển thị môi trường xem trước (Git/PR preview environments) hoàn chỉnh (`U03`).
- `[x]` Thêm trạng thái `simulated` hoặc `sandbox` rõ ràng cho SSL Certs (`CertsTab.tsx`) (`U04`).
- `[ ]` Loại bỏ hoàn toàn các simulator dự phòng trong cài đặt domain/SSL, kết nối trực tiếp với Vercel SDK DNS/Certs (`U04`).
- `[ ]` Hỗ trợ validate định dạng IP đầu vào cho bản ghi DNS (`U12`).
- `[ ]` Đồng bộ thanh toán giỏ hàng khi mua tên miền trực tiếp qua Vercel (`U13`).
- `[ ]` Hỗ trợ thêm các nhà cung cấp log drains ngoài (Datadog/Syslog) (`U11`).
- `[ ]` Quản lý vòng đời gỡ cài đặt Add-ons/Integrations (`U19`).
- `[ ]` Bổ sung tính năng kiểm thử gửi thử payload (test ping) trong Webhooks Manager (`U20`).
- `[ ]` Hiển thị tiến trình đồng bộ DNS động khi cập nhật bản ghi DNS mới qua SDK (`U12`).

### Giai đoạn 3: Tối ưu trải nghiệm DX & Trình soạn thảo Edge Config
- `[x]` Tạo liên kết chéo từ Error Tracker tới nhật trình log của Vercel/native để gỡ lỗi nhanh (`error-tracker-client.tsx`) (`U05`).
- `[x]` Tích hợp cấu phần dòng thời gian sự cố thống nhất (Incident Timeline) hiển thị chéo sự cố (`U05`).
- `[x]` Hiển thị định dạng JSON đẹp (pretty-print) mặc định cho dữ liệu cấu hình thô (`U14`).
- `[ ]` Phát triển trình xem logs trung tâm tổng hợp kết nối chéo các bảng vận hành (`U05`).
- `[ ]` Cải tiến trình soạn thảo JSON cho Edge Config Editor có kiểm tra lỗi cú pháp (`U14`).
- `[ ]` Thiết lập luồng validate tự động cấu hình đối chiếu với JSON schema trước khi lưu store (`U15`).
- `[ ]` Bổ sung giao diện so sánh trực quan (diff) giữa các bản sao lưu Edge Config và rollback nhanh (`U16`).
- `[ ]` Thêm tính năng tự động hoàn thành (autocomplete) cho các key cấu hình đã được định nghĩa trong schema (`U15`).
- `[ ]` Hiển thị cảnh báo dữ liệu chưa lưu khi người dùng chuyển tab trong khi sửa Edge Config (`U14`).

### Giai đoạn 4: Quản trị Doanh nghiệp & Vận hành Native nâng cao
- `[x]` Thêm trạng thái `simulated` hoặc `sandbox` rõ ràng cho SCIM settings (`scim-settings-client.tsx`) (`U06`).
- `[ ]` Hoàn thiện giao diện đồng bộ SCIM, kết nối hiển thị trạng thái nhà cung cấp thực tế (`U06`).
- `[x]` Bổ sung nhịp tim động (pulsing green active heartbeats) cho Connected Devices, WAF và Federated Routing (`U08`).
- `[ ]` Thêm bằng chứng dữ liệu thực thi cho các bảng định tuyến tải (`U08`/`U09`).
- `[ ]` Nâng cấp bảng điều khiển WAF và Connected Devices, giám sát logs gateway thật và quản lý version quy tắc (`U08`).
- `[x]` Chia nhỏ NativePlatformTab quá tải thành các tab quy trình chuyên biệt (Routing, Mirrors, Remediation, FinOps) sử dụng thanh điều hướng bên (`U09`).
- `[ ]` Hoàn thiện các bảng con sidebar trong tab vận hành nâng cao (`U09`).
- `[ ]` Tối ưu hóa các trạng thái trống/lỗi/đang tải của các panels Native Platform.
- `[ ]` Hiển thị biểu đồ thống kê tấn công WAF thời gian thực theo khu vực địa lý (`U08`).

### Giai đoạn 5: An ninh Zero-Trust & Chợ ứng dụng Marketplace
- `[x]` Thêm trạng thái mô phỏng rõ ràng cho zero-trust mTLS/CA flows (`zero-trust-telemetry-panel.tsx`) (`U10`).
- `[ ]` Nâng cấp giao diện Zero-Trust Telemetry, tích hợp hệ thống cảnh báo khi chứng chỉ Client mTLS thật sắp hết hạn (`U10`).
- `[ ]` Hoàn thiện đối soát doanh thu thực tế, thanh toán và quy trình kiểm duyệt (QA) đối tác phát triển chợ ứng dụng (`U07`).
- `[ ]` Thiết lập các hướng dẫn cài đặt từng bước (setup wizards) cho các luồng tích hợp phức tạp (SCIM, ACME/DNS, IPFS/Arweave, CA certificates).
- `[ ]` Thêm màn hình quản lý chứng chỉ CA cục bộ, cho phép tải lên và xem thông tin CA bundle (`U10`).
- `[ ]` Hiển thị lịch sử hoạt động xoay vòng khóa (key rotation logs) trong tab CA Manager (`U10`).
- `[ ]` Xây dựng trang thống kê doanh thu đối tác với các bộ lọc thời gian và xuất file báo cáo CSV/PDF (`U07`).
- `[ ]` Tích hợp biểu mẫu phản hồi và đánh giá ứng dụng trực tiếp trên Marketplace (`U07`).

## Quy tắc duy trì tài liệu

1. Theo dõi tiến độ giao diện theo mã nhóm `Uxx` và ánh xạ ngược lại nhóm tính năng `Fxx`.
2. Không đánh dấu giao diện là `Complete flow` nếu luồng công việc chính vẫn đang sử dụng dữ liệu mô phỏng hoặc thiếu kết nối thật.
3. Ưu tiên nâng cấp, tối ưu hóa các giao diện màn hình hiện tại thay vì tạo trang mới, ngoại trừ trường hợp trang cũ bị quá tải thông tin.
4. Khi giao diện tồn tại nhưng thiếu bằng chứng kết nối thật, đánh dấu là `Usable beta` hoặc `Operational shell`, không ghi là `Complete/Shipped`.
