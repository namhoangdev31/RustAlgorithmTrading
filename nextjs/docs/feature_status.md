# Trạng thái Tính năng Next.js

Đánh giá lần cuối: `2026-06-22`
Phạm vi: Thư mục `nextjs/` duy nhất. Đây là tài liệu chuẩn hóa về mức độ hoàn thiện tính năng của hệ thống Lepos, thay thế các phần trạng thái của `status_report.md` và kế hoạch xử lý khoảng cách tính năng trong `feature_gap_resolution_plan.md`.

## Cách đọc trạng thái

Tài liệu này phân biệt rõ giữa `UI/Bảng điều khiển đã tồn tại` (Giao diện điều khiển) và `Sẵn sàng phát hành chính thức (GA - General Availability)`. Một tính năng có thể có schema (lược đồ dữ liệu), định tuyến (routes), server actions và giao diện (panels) trong Next.js nhưng vẫn cần dữ liệu thực tế từ gateway, bridge (cầu nối), nhà cung cấp (provider) hoặc hạ tầng vận hành (ops) để đạt tiêu chuẩn chạy thực tế (production).

| Trạng thái | Ý nghĩa | Quy tắc lập kế hoạch |
|---|---|---|
| `GA-ready in nextjs` | Mô hình dữ liệu, logic máy chủ, định tuyến và giao diện vận hành được liên kết trực tiếp với dữ liệu thật trong `nextjs`. | Tối ưu hóa và mở rộng; không viết lại từ đầu. |
| `Beta in nextjs` | Giao diện sản phẩm sử dụng được nhưng cần hoàn thiện thêm các trường hợp lỗi/trống, hoặc tối ưu hóa quy trình làm việc. | Nâng cao chiều sâu và bằng chứng xác thực trước khi coi là hoàn thành. |
| `Control-plane ready` | Next.js sở hữu giao diện, lược đồ dữ liệu và actions, nhưng hoạt động thực tế cần tích hợp với gateway, bridge, provider hoặc hạ tầng. | Xác thực luồng chạy thực tế liên miền trước khi tuyên bố phát hành chính thức (GA). |
| `Prototype / simulation` | Giao diện đã tồn tại nhưng luồng xử lý chính vẫn đang sử dụng dữ liệu giả lập (mock), mô phỏng hoặc nhập tay. | Thay thế luồng mô phỏng bằng kết nối thật trước khi công bố sản phẩm. |
| `Missing` | Chưa có bất kỳ giao diện hay hợp đồng dữ liệu nào trong Next.js. | Thiết lập lược đồ/hợp đồng dữ liệu trước khi xây dựng giao diện. |

*Chú thích thuật ngữ:*
- **GA (General Availability):** Trạng thái phát hành chính thức rộng rãi đến người dùng.
- **WAF (Web Application Firewall):** Tường lửa bảo vệ ứng dụng web khỏi các cuộc tấn công.
- **SCIM (System for Cross-domain Identity Management):** Giao thức quản lý danh tính người dùng liên miền tự động.
- **mTLS (Mutual TLS):** Chứng chỉ bảo mật xác thực mã hóa kênh truyền song phương (hai chiều).
- **ISR (Incremental Static Regeneration):** Cơ chế tái tạo trang tĩnh tăng dần của Next.js.
- **CDN (Content Delivery Network):** Mạng lưới phân phối nội dung toàn cầu để giảm độ trễ.
- **DNS (Domain Name System):** Hệ thống phân giải tên miền thành địa chỉ IP.
- **CA (Certificate Authority):** Tổ chức phát hành chứng chỉ bảo mật số đáng tin cậy.
- **IPFS (InterPlanetary File System):** Giao thức mạng chia sẻ dữ liệu phân tán.
- **Arweave:** Mạng lưu trữ dữ liệu phi tập trung vĩnh viễn.
- **DX (Developer Experience):** Trải nghiệm của nhà phát triển khi sử dụng hệ thống.
- **CRUD (Create, Read, Update, Delete):** Các thao tác dữ liệu cơ bản (Thêm, Đọc, Sửa, Xóa).
- **SDK (Software Development Kit):** Bộ công cụ phát triển phần mềm được cung cấp sẵn.

## Bảng ma trận nhóm tính năng (F01 - F20)

| ID | Nhóm tính năng | Giai đoạn | Mức độ hoàn thiện | Bằng chứng thực tế trong `nextjs` | Điểm yếu cần quản lý | Hành động tiếp theo |
|---|---|---:|---|---|---|---|
| `F01` | Cổng thông tin cốt lõi, không gian làm việc | `1` | `GA-ready in nextjs` | Khung giao diện quản lý, định tuyến dự án/không gian làm việc | Tối ưu hóa dữ liệu hiển thị, không thiếu khung sản phẩm | Bảo trì và làm mượt giao diện. |
| `F02` | Triển khai (Deployments), hàng đợi, xem trước | `1/2` | `GA-ready in nextjs` | API SDK Trigger Deploy, hủy build, stream logs, xem check runs | Quy trình Git-to-preview tự động cần hoàn thiện sâu | Duy trì luồng Vercel SDK; mở rộng webhook. |
| `F03` | Quản lý tên miền và Edge cache | `2` | `GA-ready in nextjs` | DNS records CRUD, mua tên miền, SSL, xóa Edge cache | Các tiến trình native dự phòng vẫn đang badged Simulator | Đảm bảo tính năng Vercel SDK DNS/Certs hoạt động 100%. |
| `F04` | Giám sát lỗi và bản đồ nguồn | `2/3` | `GA-ready in nextjs` | Error tracker, source maps, logs streaming qua SDK | Logs trung tâm phụ thuộc vào logs drain của Vercel | Duy trì tính năng bản đồ nguồn; tận dụng logs drain. |
| `F05` | Nhật ký kiểm toán, đồng bộ SCIM | `3` | `Beta in nextjs` | Nhật ký kiểm toán chạy thật, cài đặt thư mục SCIM | Giao diện SCIM vẫn để chế độ mô phỏng nhập tay | Đánh dấu SCIM là beta, cấu hình thêm nhà cung cấp. |
| `F06` | Thiết bị kết nối, native runtime bridge | `2/3` | `Control-plane ready` | Bảng connected devices, API nhịp tim (heartbeat) | Hoạt động phụ thuộc nhịp tim kết nối thật từ bridge | Bổ sung tài liệu hợp đồng cầu nối và rate limits. |
| `F07` | Chợ ứng dụng, monetization đối tác | `1/3` | `GA-ready/Beta in nextjs` | Console đối tác phát triển, payout, analytics | Đối soát tài chính thực tế và giải quyết tranh chấp | Giữ nguyên giao diện; tối ưu quy trình đối tác. |
| `F08` | Tường lửa WAF, bảo mật lưu lượng | `3/4` | `Beta` | Bản đồ đe dọa, bảng sự kiện, cấu hình quy tắc | Cần xác thực nguồn sự kiện thật từ gateway | Xác thực thực thi từ gateway, quản lý quy tắc. |
| `F09` | Định tuyến liên kết, bản sao vùng | `4` | `Beta` | Định tuyến đa vùng, trạng thái drain, failover simulator | Cần chạy thử nghiệm tải thực tế đa vùng | Thực hiện kiểm tra định tuyến tải thực tế. |
| `F10` | Tự động khắc phục và sửa lỗi | `4` | `Beta` | Lịch sử chạy sửa lỗi, quy trình apply, timeline sự cố | Các kịch bản cần kiểm chứng an toàn trong staging | Xác thực phê duyệt an toàn và cơ chế rollback. |
| `F11` | FinOps, lập lịch giảm carbon | `4` | `Beta` | Bảng cấu hình lập lịch, thuật toán khuyến nghị build | Nguồn cấp dữ liệu carbon và chi phí vẫn đang mô phỏng | Tích hợp kết nối adapter chi phí/carbon thực tế. |
| `F12` | Danh tính dịch vụ, Zero-Trust mTLS | `4` | `Beta` | Danh tính dịch vụ, CA managed widget, rotation simulation | Cơ chế xoay vòng chứng chỉ thật chưa kết nối Client | Tích hợp xác thực chứng chỉ thực tế, CA bundle. |
| `F13` | Kết nối Log Drains với bên thứ ba | `3` | `GA-ready in nextjs` | Actions `createConfigurableLogDrain`, Datadog/Syslog | Cấu hình credentials của dịch vụ lưu trữ ngoài | Đăng ký log drain thực tế cho các dự án lớn. |
| `F14` | Hệ thống bản ghi DNS | `2` | `GA-ready in nextjs` | Actions `getDnsRecords`, CRUD bản ghi trực quan | Đồng bộ hóa độ trễ phân giải DNS toàn cầu | Hỗ trợ lưu trữ cấu hình mẫu DNS phổ biến. |
| `F15` | Quản lý Domain Aliases | `2` | `GA-ready in nextjs` | Actions `assignAlias`, `deleteAlias`, danh sách alias | Ánh xạ đồng thời nhiều alias vào một deployment | Hỗ trợ gán alias nhanh từ chi tiết deployment. |
| `F16` | Edge Config Schema Validation | `3` | `GA-ready in nextjs` | Actions `getEdgeConfigSchema`, JSON Editor | Đồng bộ trực tiếp schema với giao diện kiểm thử | Validate schema trước khi lưu để tránh cấu hình sai. |
| `F17` | Lịch sử sao lưu Edge Config | `3` | `GA-ready in nextjs` | Actions `getEdgeConfigBackups`, danh sách backup | Khôi phục bản sao lưu cần đảm bảo tính toàn vẹn | Hỗ trợ rollback nhanh về bản sao lưu trước đó. |
| `F18` | Tích hợp Add-ons & Marketplace | `1/3` | `GA-ready in nextjs` | Actions `getIntegrations`, danh sách add-ons cài đặt | Quản lý vòng đời gỡ bỏ add-on trên Vercel | Đồng bộ hóa trạng thái gỡ cài đặt add-ons. |
| `F19` | Quản lý nhóm Access Groups | `1` | `GA-ready in nextjs` | CRUD access group, gán dự án/thành viên | Đồng bộ phân quyền nhóm với phân quyền Vercel | Hoàn thiện giao diện ánh xạ nhóm vào không gian làm việc. |
| `F20` | Đăng ký Webhooks sự kiện | `1/2` | `GA-ready in nextjs` | CRUD webhook, nhận sự kiện deploy/error từ Vercel | Xác thực chữ ký số webhook (signature verification) | Tích hợp nhận diện webhook để cập nhật trạng thái UI. |

## Sức khỏe của các giai đoạn sau khi nhóm

| Giai đoạn | Độ trưởng thành thực tế trong `nextjs` | Tại sao ước tính cũ có rủi ro | Kế hoạch hiện tại |
|---|---|---|---|
| `Giai đoạn 1` Nền tảng cốt lõi & Cổng thông tin | `~92-95%` | Các màn hình chính rất mạnh mẽ, việc tích hợp đầy đủ SDK (F13-F20) giúp củng cố đáng kể luồng làm việc. | Coi `F01` là bảo trì, tinh chỉnh hoàn thiện `F02/F07` và tích hợp sâu webhook/access groups (F19/F20). |
| `Giai đoạn 2` Nền tảng Native & Edge | `~70-80%` | Tên miền, bộ nhớ cache edge, các thiết bị kết nối và WAF có giao diện và hợp đồng dữ liệu tốt, đã có nhịp tim thật. | Ưu tiên hoàn thiện `F03` và các tích hợp liên quan đến DNS/Alias (F14/F15) chạy qua SDK thực tế. |
| `Giai đoạn 3` Trải nghiệm nhà phát triển (DX) & AI DevOps | `~80-88%` | Hệ thống lỗi, source maps và log drains bên ngoài (F13) hoạt động rất tốt; SCIM (F05) đã được gắn nhãn Simulator rõ ràng. | Duy trì `F04/F05` ở dạng beta, tập trung tích hợp log drains thực tế với các nhà cung cấp cloud. |
| `Giai đoạn 4` Advanced Edge & Tự trị | `~50-65%` | Giao diện điều khiển đã sẵn sàng, tích hợp timeline sự cố cho định tuyến, tự khắc phục và lập lịch carbon, nhưng cần xác thực thực tế từ hạ tầng (ops/gateway). | Không tuyên bố GA cho `F09-F12` cho tới khi vượt qua các thử nghiệm tải và kết nối thật với client/gateway. |

## Kế hoạch nâng cấp tính năng 10 giai đoạn

Lộ trình nâng cấp tính năng hệ thống Lepos được phân bổ thành 10 giai đoạn nâng cấp kỹ thuật, tập trung giải quyết triệt để các điểm yếu và hành động tiếp theo của F01 - F20:

### Giai đoạn 1: Chuẩn hóa nền tảng Workspace & Access Control (F01, F19)
- **Mục tiêu**: Đảm bảo không gian làm việc vững chắc và cơ chế phân quyền an toàn.
- **Các bước nâng cấp chi tiết**:
  - Bảo trì và làm mượt giao diện quản trị không gian làm việc, định tuyến và chuyển trang (`F01`).
  - Tối ưu hóa hiệu năng render cây thư mục dự án và danh sách không gian làm việc (`F01`).
  - Cải tiến cấu trúc lưu trữ LocalStorage để đồng bộ trạng thái không gian làm việc hoạt động (`F01`).
  - Đồng bộ cơ chế phân quyền nhóm (Access Groups) với hệ thống phân quyền thực tế trên Vercel (`F19`).
  - Xây dựng giao diện tạo mới Access Group, cấu hình tên và mô tả nhóm (`F19`).
  - Xây dựng giao diện chỉnh sửa thành viên trong Access Group (`F19`).
  - Hỗ trợ ánh xạ danh sách dự án thuộc quyền quản lý của Access Group (`F19`).
  - Validate định dạng tên Access Group để tránh các ký tự đặc biệt gây lỗi API (`F19`).
  - Phân loại quyền truy cập (Read, Write, Admin) chi tiết cho từng Access Group (`F19`).
  - Tích hợp thanh tìm kiếm và bộ lọc nhanh Access Groups theo dự án hoặc thành viên (`F19`).
  - Xây dựng nhật ký ghi lại các thay đổi cấu hình Access Group (`F19`).
  - Ngăn chặn việc xóa Access Group mặc định hoặc các nhóm đang chứa tài khoản admin (`F19`).
  - Đồng bộ hóa quyền của thành viên từ Access Group xuống các dự án con liên kết (`F19`).
  - Thiết lập cảnh báo và xác nhận khi thay đổi quyền truy cập của một nhóm (`F19`).
  - Tối ưu hóa thời gian phản hồi của API tải danh sách Access Groups xuống dưới 200ms (`F19`).

### Giai đoạn 2: Tự động hóa Triển khai & Xác thực Webhooks (F02, F20)
- **Mục tiêu**: Đưa luồng triển khai tự động từ Git vào vận hành chính thức và bảo mật kênh nhận sự kiện.
- **Các bước nâng cấp chi tiết**:
  - Hoàn thiện quy trình Git-to-preview tự động từ khi push code đến khi sinh preview URL (`F02`).
  - Tích hợp API SDK Vercel để trigger deploy dự án tự động (`F02`).
  - Xây dựng nút hủy bỏ tiến trình build (Cancel build) đang chạy thông qua SDK (`F02`).
  - Cấu hình luồng stream logs thời gian thực cho quá trình build giúp nhà phát triển theo dõi (`F02`).
  - Hiển thị chi tiết hàng đợi build và trạng thái các check runs trên giao diện (`F02`).
  - Xây dựng giao diện CRUD Webhooks trong cài đặt dự án (`F20`).
  - Tích hợp xác thực chữ ký số webhook (signature verification) sử dụng secret key (`F20`).
  - Hỗ trợ đăng ký nhận sự kiện deployment bắt đầu/thành công/thất bại từ Vercel (`F20`).
  - Hỗ trợ đăng ký nhận sự kiện phát hiện lỗi (error metrics) từ Error Tracker (`F20`).
  - Bổ sung nút gửi payload thử nghiệm (Test/Ping webhook) trực quan từ dashboard (`F20`).
  - Hiển thị lịch sử gửi webhook (delivery logs) với chi tiết HTTP response code và payload (`F20`).
  - Tự động vô hiệu hóa webhook sau 5 lần gửi thất bại liên tiếp với mã lỗi 5xx (`F20`).
  - Cho phép cấu hình các tùy chỉnh HTTP Headers bổ sung khi gửi webhook payload (`F20`).
  - Hỗ trợ cơ chế tự động retry 3 lần khi webhook nhận phản hồi timeout từ máy chủ đích (`F20`).
  - Thực hiện mã hóa một chiều lưu trữ webhook secret trong cơ sở dữ liệu (`F20`).

### Giai đoạn 3: Tích hợp SDK Quản lý Tên miền & Bản ghi DNS (F03, F14, F15)
- **Mục tiêu**: Kết nối hoàn chỉnh các dịch vụ domain/DNS qua SDK thật.
- **Các bước nâng cấp chi tiết**:
  - Kết nối Vercel SDK DNS/Certs để quản lý tên miền và SSL tự động (`F03`).
  - Đồng bộ hóa tự động trạng thái xác thực ACME/DNS challenge cho SSL (`F03`).
  - Loại bỏ hoàn toàn các simulator dự phòng trong cài đặt domain/SSL (`F03`).
  - Thiết lập hệ thống bản ghi DNS trực quan, hỗ trợ đầy đủ thao tác CRUD bản ghi (`F14`).
  - Đồng bộ hóa độ trễ phân giải DNS toàn cầu để giảm thiểu thời gian chờ (`F14`).
  - Hỗ trợ CRUD các loại bản ghi DNS nâng cao bao gồm SRV, CAA, TXT thông qua SDK (`F14`).
  - Validate định dạng IP đầu vào cho bản ghi A (IPv4) và AAAA (IPv6) (`F14`).
  - Bổ sung cảnh báo khi cấu hình trùng lặp bản ghi CNAME và bản ghi khác (`F14`).
  - Hỗ trợ ánh xạ đồng thời nhiều alias vào một deployment thông qua SDK (`F15`).
  - Thêm nút gán alias nhanh từ chi tiết trang deployment (`F15`).
  - Tự động kiểm tra tính hợp lệ của alias trước khi gán (`F15`).
  - Hỗ trợ xóa hàng loạt alias không còn sử dụng (`F15`).
  - Đồng bộ hóa SSL certificate tự động khi thêm alias mới (`F03`/`F15`).
  - Tích hợp SDK Domain Registrar để hỗ trợ tra cứu và mua tên miền trực tiếp (`F03`).
  - Hiển thị chi tiết vòng đời chứng chỉ và cảnh báo ngày hết hạn SSL trên giao diện (`F03`).

### Giai đoạn 4: DX Giám sát lỗi & Logs Drain ngoại vi (F04, F13)
- **Mục tiêu**: Tối ưu trải nghiệm gỡ lỗi thông qua liên kết log drains ngoại vi.
- **Các bước nâng cấp chi tiết**:
  - Phát triển Trình quản lý bản đồ nguồn (source maps) để giải mã stack trace ngược về code gốc (`F04`).
  - Hiển thị trích đoạn mã nguồn bị lỗi trực tiếp trên Error Details từ source map (`F04`).
  - Liên kết trực tiếp lỗi chi tiết (Error tracker) với logs drain hoặc logs tab (`F04`).
  - Tối ưu hóa hiệu năng tải và hiển thị source maps để không vượt quá giới hạn 50MB (`F04`).
  - Xây dựng cấu phần biểu đồ xu hướng lỗi theo thời gian (`F04`).
  - Tích hợp Log Drains đăng ký thực tế cho Datadog/Syslog thông qua API Vercel SDK (`F13`).
  - Hỗ trợ cấu hình định dạng log drain (JSON, NDJSON, hoặc Syslog RFC5424) (`F13`).
  - Cung cấp giao diện quản lý credentials bảo mật cho các đầu cuối nhận log ngoài (`F13`).
  - Bổ sung bộ lọc log drains theo dự án hoặc theo môi trường (`F13`).
  - Tự động mã hóa HTTPS endpoint URL của log drains khi lưu trữ (`F13`).
  - Hỗ trợ giới hạn băng thông log drain (rate-limiting) để tránh quá tải server nhận (`F13`).
  - Hiển thị trạng thái hoạt động (Active/Inactive) của log drain bằng kết nối kiểm thử (`F13`).
  - Tích hợp gỡ lỗi log drains lỗi thông qua hiển thị log vận chuyển nội bộ (`F13`).
  - Hỗ trợ thêm các nhà cung cấp cloud lớn (AWS S3, Google Cloud Storage) làm đích log drain (`F13`).
  - Cấu hình tự động gửi email báo động khi dịch vụ log drain bên thứ ba gặp sự cố gián đoạn (`F13`).

### Giai đoạn 5: Đồng bộ danh tính tự động SCIM & Audit Logs (F05)
- **Mục tiêu**: Chuyển đổi SCIM từ mock sang đồng bộ thật và bảo vệ nhật ký kiểm toán.
- **Các bước nâng cấp chi tiết**:
  - Kết nối API SCIM với các nhà cung cấp danh tính thực tế (Okta, Azure AD) (`F05`).
  - Đánh dấu SCIM sync UI là sandbox/manual rõ ràng trong giao diện cài đặt (`F05`).
  - Thiết lập cơ chế lưu trữ audit logs dài hạn bất biến (Immutable Audit Storage) (`F05`).
  - Cung cấp bộ lọc và chức năng xuất nhật ký kiểm toán (Audit Logs) dạng CSV/JSON (`F05`).
  - Lưu trữ lịch sử đăng nhập thành công/thất bại của các tài khoản trên hệ thống (`F05`).
  - Xây dựng luồng tự động đồng bộ nhóm người dùng từ IDP qua SCIM (`F05`).
  - Hỗ trợ mapping các thuộc tính tùy chỉnh (custom attributes) của người dùng qua SCIM (`F05`).
  - Hiển thị lịch sử các yêu cầu SCIM đồng bộ lỗi kèm lý do chi tiết (`F05`).
  - Bổ sung tùy chọn gửi cảnh báo email khi có sự kiện đồng bộ SCIM thất bại (`F05`).
  - Tích hợp hệ thống phân tích nhật ký kiểm toán với SIEM streaming (`F05`).
  - Ngăn chặn chỉnh sửa thủ công thông tin người dùng được quản lý bởi SCIM (`F05`).
  - Validate token xác thực SCIM (SCIM Bearer Token) thời hạn tối đa 1 năm (`F05`).
  - Hỗ trợ khôi phục tài khoản bị khóa nhầm do lỗi đồng bộ SCIM (`F05`).
  - Tối ưu hóa hiệu năng truy vấn Audit Logs với Indexing MongoDB/Postgres (`F05`).
  - Hỗ trợ xuất dữ liệu Audit Logs theo thời gian cấu hình tùy chỉnh để lưu trữ ngoài (`F05`).

### Giai đoạn 6: Cầu nối Native Runtime & Thiết bị kết nối (F06)
- **Mục tiêu**: Kích hoạt việc giám sát thiết bị chạy thực tế.
- **Chi tiết nâng cấp**: Tích hợp hợp đồng cầu nối (bridge contract) và kiểm soát rate limits, thay thế dữ liệu mock bằng luồng nhịp tim (heartbeat) thực tế gửi về từ các thiết bị local.

### Giai đoạn 7: Bảo mật Edge & WAF Gateway (F08)
- **Mục tiêu**: Xác thực an ninh lưu lượng biên qua WAF thật.
- **Chi tiết nâng cấp**: Liên kết bản đồ đe dọa và bảng sự kiện WAF với cổng dữ liệu sự kiện thật từ gateway, thiết lập cơ chế quản lý phiên bản luật (WAF rules versioning) và giảm thiểu tỷ lệ báo động giả.

### Giai đoạn 8: Quản trị cấu hình an toàn với Edge Config (F16, F17)
- **Mục tiêu**: Bảo vệ dữ liệu cấu hình store khỏi các cấu hình sai sót.
- **Chi tiết nâng cấp**: Tích hợp validate định dạng JSON schema trước khi lưu biến cấu hình, hỗ trợ rollback nhanh về các bản sao lưu Edge Config trước đó để khắc phục lỗi vận hành ngay lập tức.

### Giai đoạn 9: Marketplace & Chợ ứng dụng đối tác (F07, F18)
- **Mục tiêu**: Thương mại hóa cổng kết nối đối tác.
- **Chi tiết nâng cấp**: Hoàn thiện cơ chế đối soát tài chính thực tế và vòng đời cài đặt/gỡ cài đặt các add-ons từ Marketplace bên thứ ba thông qua Vercel integrations.

### Giai đoạn 10: Định tuyến liên kết & Vận hành Tự trị (F09, F10, F11, F12)
- **Mục tiêu**: Đạt mức độ tự trị cấp độ Enterprise cho Edge Platform.
- **Chi tiết nâng cấp**: Thực hiện các bài test tải định tuyến đa vùng (Federated Routing), xây dựng cơ chế phê duyệt tự động khắc phục lỗi (Remediation) có rollback, tích hợp các adapter carbon/chi phí thật cho FinOps và kết nối client certificate rotation thực tế cho Zero-Trust mTLS.

## Các điểm đính chính cần được phản ánh trong tài liệu này

| Rủi ro trong cách diễn đạt cũ | Trạng thái đúng | Lý do |
|---|---|---|
| `Directory Sync / SCIM` được coi là đã phát hành đầy đủ | `Beta in nextjs` | API và ánh xạ SCIM đã tồn tại, nhưng giao diện vẫn hiển thị trình mô phỏng đồng bộ tay, xác thực nhà cung cấp còn nông. |
| `Domain SSL` được coi là đã phát hành | `Prototype / simulation` | Quá trình ACME/DNS challenge và tạo chứng chỉ SSL vẫn là mô phỏng trong server helper. |
| `Edge functions` được coi là đã phát hành đầy đủ | `Beta in nextjs` | Tải mã nguồn qua HTTP hoạt động thật, nhưng đường dẫn lưu trữ đối tượng vẫn sử dụng mock Wasm fallback. |
| `WAF` được coi là đã phát hành | `Beta` (đã có heartbeat) | Giao diện cấu hình quy tắc và bản đồ đe dọa tồn tại; chất lượng thực thi và sự kiện WAF cần được chứng minh qua gateway thật. |
| `Artifact mirrors` được coi là GA vận hành | `Beta` | Cần cấu hình biến môi trường adapter; việc đẩy bản sao lỗi có thể tạo ra dữ liệu fallback thay vì mirror thành công thực sự. |
| `Auto-remediation` được coi là hoàn thành vòng khép kín | `Beta` | Các lượt chạy và quy trình chạy thử/áp dụng đã có, nhưng cổng phê duyệt và bằng chứng chạy thử cần kiểm chứng trên staging. |
| `FinOps` được coi là bộ lập lịch hoàn chỉnh | `Beta` | Luồng khuyến nghị lập lịch hiện tại sử dụng các tín hiệu giả lập/nhà cung cấp; cần kết nối dữ liệu carbon và chi phí thực tế. |
| `Zero-trust/mTLS` được coi là đã phát hành | `Beta` | Việc thực thi hiện tại dựa trên header/metadata và mô phỏng xoay vòng chứng chỉ, chưa xác thực client cert thật trên gateway. |

## Các nhóm tính năng đủ vững chắc để xây dựng tiếp

- `F01` có thể coi là nền tảng cổng thông tin (portal) cực kỳ ổn định.
- `F04` trình quản lý source maps và xem trước mã nguồn lỗi hoạt động tốt, nên phát triển tiếp thay vì viết lại.
- `F05` bộ lọc và xuất nhật ký kiểm toán (audit log) là luồng lưu trữ thực tế; không đưa vào các timeline giả lập.
- `F07` console dành cho đối tác có đủ không gian để phát triển thêm các mô hình kiếm tiền sâu hơn.
- `F13-F20` các tích hợp Vercel SDK (Log Drains, DNS Records, Domain Aliases, Edge Config Schema/Backups, Access Groups, Webhooks) có mã nguồn kết nối thật, là điểm tựa vững chắc để hoàn thiện sản phẩm.
- `F09-F12` có cấu trúc dữ liệu và giao diện rất tốt, nhưng cần kiểm chứng thực tế với môi trường chạy (runtime) trước khi công bố GA.

## Danh sách ưu tiên xử lý điểm yếu (Canonical Backlog)

### Giai đoạn 1: Chuẩn hóa nền tảng Workspace & Access Control (F01, F19)
- `[x]` Làm mượt giao diện quản trị không gian làm việc và tối ưu hóa điều hướng (`F01`).
- `[x]` Thiết lập khung giao diện cơ bản và cấu trúc định tuyến cho các tab cài đặt (`F01`).
- `[x]` Đồng bộ hóa trạng thái tải (loading states) giữa các trang dự án (`F01`).
- `[ ]` Đồng bộ cơ chế phân quyền nhóm (Access Groups) với hệ thống phân quyền thực tế trên Vercel (`F19`).
- `[ ]` Xây dựng giao diện CRUD cho Nhóm truy cập (Access Groups) trong Workspace Settings (`F19`).
- `[ ]` Hỗ trợ gán nhiều dự án cùng lúc vào một Access Group (`F19`).
- `[ ]` Hỗ trợ thêm/xóa thành viên trong Access Group với phân quyền trực quan (`F19`).
- `[ ]` Đồng bộ hóa quyền của thành viên từ Access Group xuống các dự án con (`F19`).
- `[ ]` Validate đầu vào tên nhóm không chứa ký tự đặc biệt (`F19`).
- `[ ]` Hiển thị danh sách dự án thuộc một Access Group dưới dạng lưới (`F19`).
- `[ ]` Thêm bộ lọc tìm kiếm nhanh nhóm truy cập theo tên (`F19`).
- `[ ]` Hiển thị nhật ký thay đổi thành viên của Access Group (`F19`).
- `[ ]` Ngăn chặn xóa Access Group mặc định của Workspace (`F19`).
- `[ ]` Xử lý lỗi phân quyền khi user không phải Owner cố gắng chỉnh sửa Access Group (`F19`).
- `[ ]` Tối ưu hóa API load danh sách Access Groups để giảm độ trễ dưới 200ms (`F19`).

### Giai đoạn 2: Tự động hóa Triển khai & Xác thực Webhooks (F02, F20)
- `[x]` Thiết lập API SDK gọi để trigger deploy dự án (`F02`).
- `[x]` Cấu hình cơ chế stream logs thời gian thực cho quá trình build (`F02`).
- `[x]` Hiển thị trạng thái hàng đợi và kiểm tra chạy (check runs) trên giao diện (`F02`).
- `[ ]` Hoàn thiện quy trình Git-to-preview tự động (`F02`).
- `[ ]` Bổ sung nút hủy bỏ tiến trình build (Cancel build) đang chạy thông qua SDK (`F02`).
- `[ ]` Xây dựng giao diện CRUD Webhooks trong phần cài đặt dự án (`F20`).
- `[ ]` Tích hợp xác thực chữ ký số webhook (signature verification) sử dụng secret key (`F20`).
- `[ ]` Hỗ trợ đăng ký nhận sự kiện deployment bắt đầu/thành công/thất bại (`F20`).
- `[ ]` Hỗ trợ đăng ký nhận sự kiện phát hiện lỗi (error metrics) từ Error Tracker (`F20`).
- `[ ]` Bổ sung nút gửi payload thử nghiệm (Test/Ping webhook) trực quan (`F20`).
- `[ ]` Hiển thị lịch sử gửi webhook (delivery logs) với HTTP response code (`F20`).
- `[ ]` Tự động vô hiệu hóa webhook sau 5 lần gửi thất bại liên tiếp với mã lỗi 5xx (`F20`).
- `[ ]` Cho phép tùy chỉnh các header bổ sung khi gửi webhook payload (`F20`).
- `[ ]` Hỗ trợ cấu hình retry tự động 3 lần khi webhook nhận phản hồi timeout (`F20`).
- `[ ]` Mã hóa lưu trữ webhook secret trong cơ sở dữ liệu (`F20`).

### Giai đoạn 3: Tích hợp SDK Quản lý Tên miền & Bản ghi DNS (F03, F14, F15)
- `[x]` Thêm trạng thái mô phỏng/sandbox rõ ràng cho SSL Certs để tránh gây hiểu lầm (`F03`).
- `[x]` Hỗ trợ tạo và xóa bản ghi DNS cơ bản trên giao diện (`F14`).
- `[x]` Hiển thị danh sách các bí danh (aliases) của tài khoản Vercel (`F15`).
- `[ ]` Kết nối Vercel SDK DNS/Certs thật để loại bỏ hoàn toàn các simulator trong SSL (`F03`).
- `[ ]` Đồng bộ hóa tự động trạng thái xác thực ACME/DNS challenge cho SSL (`F03`).
- `[ ]` Đồng bộ hóa độ trễ phân giải DNS toàn cầu cho hệ thống bản ghi (`F14`).
- `[ ]` Hỗ trợ CRUD bản ghi DNS nâng cao (SRV, CAA, TXT) thông qua SDK (`F14`).
- `[ ]` Validate định dạng IP đầu vào cho bản ghi A (IPv4) và AAAA (IPv6) (`F14`).
- `[ ]` Bổ sung cảnh báo khi cấu hình trùng lặp bản ghi CNAME và bản ghi khác (`F14`).
- `[ ]` Hỗ trợ ánh xạ đồng thời nhiều alias vào một deployment thông qua SDK (`F15`).
- `[ ]` Thêm nút gán alias nhanh từ chi tiết trang deployment (`F15`).
- `[ ]` Tự động kiểm tra tính hợp lệ của alias trước khi gán (`F15`).
- `[ ]` Hỗ trợ xóa hàng loạt alias không còn sử dụng (`F15`).
- `[ ]` Đồng bộ hóa SSL certificate tự động khi thêm alias mới (`F03`/`F15`).
- `[ ]` Tích hợp SDK Domain Registrar để hỗ trợ tra cứu và mua tên miền trực tiếp (`F03`).

### Giai đoạn 4: DX Giám sát lỗi & Logs Drain ngoại vi (F04, F13)
- `[x]` Liên kết trực tiếp lỗi chi tiết (Error tracker) với logs drain hoặc logs tab (`F04`).
- `[x]` Thiết lập khung import source maps để giải mã stack trace (`F04`).
- `[x]` Hiển thị trích đoạn mã nguồn bị lỗi trực tiếp trên Error Details (`F04`).
- `[ ]` Tối ưu hóa trình quản lý source maps và xem trước mã nguồn lỗi (`F04`).
- `[ ]` Xây dựng cấu phần biểu đồ xu hướng lỗi theo thời gian (`F04`).
- `[ ]` Tích hợp Log Drains đăng ký thực tế cho Datadog/Syslog thông qua API Vercel SDK (`F13`).
- `[ ]` Hỗ trợ cấu hình định dạng log drain (JSON, NDJSON, hoặc Syslog RFC5424) (`F13`).
- `[ ]` Cung cấp giao diện quản lý credentials bảo mật cho các đầu cuối nhận log ngoài (`F13`).
- `[ ]` Bổ sung bộ lọc log drains theo dự án hoặc theo môi trường (`F13`).
- `[ ]` Tự động mã hóa HTTPS endpoint URL của log drains khi lưu trữ (`F13`).
- `[ ]` Hỗ trợ giới hạn băng thông log drain (rate-limiting) để tránh quá tải server nhận (`F13`).
- `[ ]` Hiển thị trạng thái hoạt động (Active/Inactive) của log drain bằng kết nối kiểm thử (`F13`).
- `[ ]` Tích hợp gỡ lỗi log drains lỗi thông qua hiển thị log vận chuyển nội bộ (`F13`).
- `[ ]` Hỗ trợ thêm các nhà cung cấp cloud lớn (AWS S3, Google Cloud Storage) làm đích log drain (`F13`).
- `[ ]` Tối ưu hóa kích thước file source map tải lên để không vượt quá giới hạn 50MB (`F04`).

### Giai đoạn 5: Đồng bộ danh tính tự động SCIM & Audit Logs (F05)
- `[x]` Đánh dấu SCIM sync UI là sandbox/manual rõ ràng trong giao diện cài đặt (`F05`).
- `[x]` Cung cấp bộ lọc và chức năng xuất nhật ký kiểm toán (Audit Logs) dạng CSV (`F05`).
- `[x]` Lưu trữ lịch sử đăng nhập thành công/thất bại của các tài khoản (`F05`).
- `[ ]` Kết nối API SCIM với các nhà cung cấp Okta/Azure AD để đồng bộ thật (`F05`).
- `[ ]` Thiết lập cơ chế lưu trữ audit logs dài hạn bất biến (Immutable Audit Storage) (`F05`).
- `[ ]` Xây dựng luồng tự động đồng bộ nhóm người dùng từ IDP qua SCIM (`F05`).
- `[ ]` Hỗ trợ mapping các thuộc tính tùy chỉnh (custom attributes) của người dùng qua SCIM (`F05`).
- `[ ]` Hiển thị lịch sử các yêu cầu SCIM đồng bộ lỗi kèm lý do chi tiết (`F05`).
- `[ ]` Bổ sung tùy chọn gửi cảnh báo email khi có sự kiện đồng bộ SCIM thất bại (`F05`).
- `[ ]` Tích hợp hệ thống phân tích nhật ký kiểm toán với SIEM streaming (`F05`).
- `[ ]` Ngăn chặn chỉnh sửa thủ công thông tin người dùng được quản lý bởi SCIM (`F05`).
- `[ ]` Validate token xác thực SCIM (SCIM Bearer Token) thời hạn tối đa 1 năm (`F05`).
- `[ ]` Hỗ trợ khôi phục tài khoản bị khóa nhầm do lỗi đồng bộ SCIM (`F05`).
- `[ ]` Tối ưu hóa hiệu năng truy vấn Audit Logs với Indexing MongoDB/Postgres (`F05`).
- `[ ]` Hỗ trợ xuất Audit Logs định dạng JSON phục vụ tích hợp tự động (`F05`).

### Giai đoạn 6: Cầu nối Native Runtime & Thiết bị kết nối (F06)
- `[x]` Tích hợp nhịp tim (heartbeat) động hiển thị độ tin cậy kết nối thiết bị (`F06`).
- `[x]` Thiết lập bảng hiển thị danh sách thiết bị kết nối thời gian thực (`F06`).
- `[x]` Cho phép gửi lệnh ping thủ công tới thiết bị kiểm tra phản hồi (`F06`).
- `[ ]` Thiết lập tài liệu hợp đồng cầu nối (bridge contract) và quản lý rate limits (`F06`).
- `[ ]` Thay thế dữ liệu mock thiết bị bằng luồng tín hiệu thật từ bridge cục bộ (`F06`).
- `[ ]` Xây dựng cơ chế xác thực thiết bị sử dụng JWT token thời hạn ngắn (`F06`).
- `[ ]` Hiển thị chi tiết phiên kết nối cuối cùng (last-session drill-down) của từng thiết bị (`F06`).
- `[ ]` Tự động chuyển trạng thái thiết bị sang Offline nếu mất nhịp tim sau 30 giây (`F06`).
- `[ ]` Hỗ trợ theo dõi băng thông tiêu thụ thời gian thực của từng thiết bị (`F06`).
- `[ ]` Cho phép khóa hoặc ngắt kết nối thiết bị trực tiếp từ giao diện điều khiển (`F06`).
- `[ ]` Tích hợp cảnh báo khi thiết bị có lượng yêu cầu vượt ngưỡng cho phép (Anomaly detection) (`F06`).
- `[ ]` Hỗ trợ nâng cấp firmware/software từ xa cho thiết bị thông qua cầu nối (`F06`).
- `[ ]` Đồng bộ hóa múi giờ thiết bị cục bộ với múi giờ hệ thống Lepos (`F06`).
- `[ ]` Xử lý lỗi ngắt kết nối đột ngột của thiết bị mà không làm treo luồng điều khiển chính (`F06`).
- `[ ]` Lưu trữ lịch sử kết nối của thiết bị trong vòng 30 ngày gần nhất (`F06`).

### Giai đoạn 7: Bảo mật Edge & WAF Gateway (F08)
- `[x]` Bổ sung nhịp tim hoạt động động (live heartbeat feed) cho WAF để tăng độ tự tin (`F08`).
- `[x]` Thiết lập giao diện bản đồ đe dọa (Threat Map) trực quan (`F08`).
- `[x]` Hiển thị bảng sự kiện tấn công bị chặn kèm địa chỉ IP và quốc gia nguồn (`F08`).
- `[ ]` Kết nối bản đồ đe dọa và bảng sự kiện WAF với cổng dữ liệu sự kiện thật từ gateway (`F08`).
- `[ ]` Thiết lập cơ chế quản lý phiên bản luật (WAF rules versioning) và false-positive workflow (`F08`).
- `[ ]` Hỗ trợ tùy chỉnh độ nhạy (Sensitivity) của tường lửa WAF theo các cấp độ (`F08`).
- `[ ]` Cho phép thêm thủ công IP vào danh sách đen (Blocklist) hoặc danh sách trắng (Allowlist) (`F08`).
- `[ ]` Hỗ trợ cấu hình chặn theo quốc gia hoặc khu vực địa lý (Geo-blocking) (`F08`).
- `[ ]` Tích hợp hệ thống phát hiện và chặn các cuộc tấn công DDoS ở tầng ứng dụng (`F08`).
- `[ ]` Hiển thị biểu đồ thống kê các loại tấn công phổ biến (SQL Injection, XSS, Path Traversal) (`F08`).
- `[ ]` Hỗ trợ gửi thông báo tức thời qua Slack/Telegram khi phát hiện đợt tấn công lớn (`F08`).
- `[ ]` Cho phép xuất danh sách các sự kiện tấn công ra file CSV phục vụ báo cáo bảo mật (`F08`).
- `[ ]` Xây dựng cơ chế bypass WAF cho các dải IP của dịch vụ đối tác tin cậy (`F08`).
- `[ ]` Validate cú pháp các quy tắc WAF tùy chỉnh (custom regex rules) trước khi áp dụng (`F08`).
- `[ ]` Tối ưu hóa thời gian xử lý quy tắc WAF tại Edge Gateway dưới 5ms (`F08`).

### Giai đoạn 8: Quản trị cấu hình an toàn với Edge Config (F16, F17)
- `[x]` Thiết lập giao diện soạn thảo biến JSON Edge Config trực quan (`F16`).
- `[x]` Hiển thị danh sách các bản sao lưu (backups) của Edge Config store (`F17`).
- `[x]` Bổ sung nút Rollback để khôi phục nhanh về cấu hình cũ (`F17`).
- `[ ]` Validate định dạng JSON schema tự động trước khi lưu store (`F16`).
- `[ ]` Hỗ trợ cấu hình và kiểm thử JSON Schema cho Config Store ngay trên giao diện (`F16`).
- `[ ]` Hiển thị so sánh trực quan sự khác biệt (diff visualizer) giữa bản hiện tại và bản sao lưu (`F17`).
- `[ ]` Ngăn chặn lưu cấu hình nếu phát hiện lỗi cú pháp JSON hoặc sai lệch schema (`F16`).
- `[ ]` Tự động sao lưu cấu hình trước mỗi lần chỉnh sửa trực tiếp (`F17`).
- `[ ]` Hỗ trợ đặt tên và ghi chú cho mỗi phiên bản sao lưu Edge Config (`F17`).
- `[ ]` Cho phép giới hạn dung lượng lưu trữ của một Config Store không vượt quá 128KB (`F16`).
- `[ ]` Hỗ trợ tìm kiếm nhanh các key cấu hình trong bảng JSON editor (`F16`).
- `[ ]` Phân quyền chỉnh sửa Config Store (chỉ Operator và Owner được sửa, Developer được xem) (`F16`).
- `[ ]` Đồng bộ hóa tức thì các thay đổi Edge Config đến các region Edge Nodes (`F16`).
- `[ ]` Lưu trữ lịch sử tối đa 100 bản sao lưu Edge Config gần nhất (`F17`).
- `[ ]` Xử lý lỗi đồng bộ khi khôi phục bản sao lưu cấu hình bị lỗi kết nối mạng (`F17`).

### Giai đoạn 9: Marketplace & Chợ ứng dụng đối tác (F07, F18)
- `[x]` Thiết lập console dành cho đối tác phát triển ứng dụng (`F07`).
- `[x]` Cung cấp các biểu đồ analytics lượt tải và thống kê payout (`F07`).
- `[x]` Hiển thị danh sách các add-ons đã cài đặt trên giao diện dự án (`F18`).
- `[ ]` Hoàn thiện cơ chế đối soát tài chính thực tế và thanh toán cho chợ ứng dụng (`F07`).
- `[ ]` Đồng bộ hóa trạng thái cài đặt/gỡ cài đặt các add-ons từ Marketplace bên thứ ba (`F18`).
- `[ ]` Xây dựng luồng thanh toán tích hợp và đối soát hóa đơn tự động hàng tháng (`F07`).
- `[ ]` Hỗ trợ xử lý tranh chấp và hoàn tiền (refunds/disputes) cho đối tác phát triển (`F07`).
- `[ ]` Thiết lập quy trình kiểm duyệt (QA review) và xuất bản add-on lên Marketplace (`F07`).
- `[ ]` Cho phép cấu hình các biến môi trường tự động khi cài đặt một add-on mới (`F18`).
- `[ ]` Hỗ trợ cập nhật phiên bản add-on tự động hoặc thủ công từ phía đối tác (`F18`).
- `[ ]` Validate tính toàn vẹn của mã add-on trước khi cho phép cài đặt vào dự án (`F18`).
- `[ ]` Hiển thị đánh giá và nhận xét của người dùng đối với từng add-on trên Marketplace (`F07`).
- `[ ]` Hỗ trợ liên kết tài khoản thanh toán của đối tác phát triển qua Stripe Connect (`F07`).
- `[ ]` Ngăn chặn cài đặt các add-on không tương thích với phiên bản framework hiện tại (`F18`).
- `[ ]` Cung cấp tài liệu API hướng dẫn đối tác tích hợp sản phẩm vào chợ ứng dụng (`F07`).

### Giai đoạn 10: Định tuyến liên kết & Vận hành Tự trị (F09, F10, F11, F12)
- `[x]` Chia nhỏ giao diện Native Platform quá tải thành các tab chuyên biệt có timeline sự cố (`F09/F10`).
- `[x]` Tích hợp cấu phần dòng thời gian sự cố (Incident Timeline) hiển thị chéo sự cố (`F09`/`F10`).
- `[x]` Thiết lập giao diện cấu hình chính sách định tuyến đa vùng và replicas (`F09`).
- `[ ]` Thực hiện các bài test tải định tuyến đa vùng (Federated Routing) và đo đạc gateway latency (`F09`).
- `[ ]` Xác thực phê duyệt tự động khắc phục lỗi (Remediation) có rollback và bằng chứng audit bất biến (`F10`).
- `[ ]` Tích hợp các adapter carbon/chi phí thật cho FinOps và bộ lập lịch build carbon-aware (`F11`).
- `[ ]` Kết nối client certificate rotation thực tế cho Zero-Trust mTLS và CA bundle lifecycle (`F12`).
- `[ ]` Hỗ trợ cấu hình tự động chuyển đổi dự phòng (failover) vùng khi region gặp sự cố (`F09`).
- `[ ]` Hiển thị trạng thái sức khỏe (health checks) của các region replicas thời gian thực (`F09`).
- `[ ]` Xây dựng quy trình phê duyệt thủ công (approval gate) trước khi chạy kịch bản khắc phục lỗi (`F10`).
- `[ ]` Hỗ trợ chế độ chạy thử nghiệm không ảnh hưởng (dry-run mode) của kịch bản sửa lỗi (`F10`).
- `[ ]` Tự động đề xuất lịch trình build tối ưu để giảm thiểu chi phí và phát thải carbon (`F11`).
- `[ ]` Hiển thị biểu đồ đo lường lượng phát thải carbon của các máy chủ build (`F11`).
- `[ ]` Tự động xoay vòng chứng chỉ client mTLS định kỳ hàng tuần mà không gây gián đoạn kết nối (`F12`).
- `[ ]` Cung cấp nút khẩn cấp tắt mTLS xác thực (fallback-disable gate) trong trường hợp sự cố CA (`F12`).

## Quy tắc duy trì tài liệu

1. Cập nhật tài liệu này theo mã nhóm tính năng `Fxx`, không sử dụng các nhãn giai đoạn mơ hồ.
2. Một nhóm tính năng chỉ được chuyển sang trạng thái `GA-ready in nextjs` khi luồng thành công chính không phải là mock/giả lập và có bằng chứng lưu trữ dữ liệu thật.
3. Nếu phần việc còn lại nằm ở `go`, `ops`, môi trường nhà cung cấp hoặc các kênh dữ liệu cầu nối/runtime, hãy giữ trạng thái là `Control-plane ready` hoặc `Beta`.
4. Sử dụng tài liệu `docs/uiux_status.md` để theo dõi độ sẵn sàng của trang/giao diện và tài liệu này để theo dõi độ hoàn thiện của tính năng/môi trường chạy.
