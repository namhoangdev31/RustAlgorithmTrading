# Năng lực Hệ thống và Trạng thái Cạnh tranh

Đánh giá lần cuối: `2026-06-22`

Phạm vi: Đánh giá độ sẵn sàng về mặt tính năng và độ phủ giao diện (UI) trong thư mục `nextjs/`, đối chiếu với tài liệu chính thức của Vercel, Railway và Firebase Hosting/App Hosting. Tài liệu này đóng vai trò là góc nhìn quản trị kết nối hai tệp `docs/feature_status.md` (nhóm tính năng `Fxx`) và `docs/uiux_status.md` (nhóm giao diện `Uxx`) lại với nhau.

## Mô hình phân loại trạng thái

| Nhãn phân loại | Ý nghĩa |
|---|---|
| `Product-ready` | Tính năng đã đủ hoàn thiện trong `nextjs` để tiếp tục cải tiến/tối ưu mà không cần viết lại. |
| `Beta` | Giao diện thực tế đã tồn tại nhưng cần hoàn thiện thêm về độ sâu nghiệp vụ, bằng chứng dữ liệu hoặc luồng thao tác. |
| `Control-plane` | Next.js đã có giao diện điều khiển và cấu trúc dữ liệu; độ hoàn thiện thực tế phụ thuộc vào việc xác thực kết nối runtime/provider/ops. |
| `Prototype` | Luồng xử lý chính vẫn đang sử dụng dữ liệu mô phỏng, nhập tay hoặc chưa được xác thực bằng mật mã/runtime. |
| `Competitor strong` | Vercel, Railway hoặc Firebase đã cung cấp tính năng này ở dạng hoàn chỉnh mặc định hoặc tích hợp rất sâu. |

*Giải nghĩa viết tắt thuật ngữ:*
- **CA (Certificate Authority):** Tổ chức chứng nhận khóa công khai phát hành SSL.
- **WAF (Web Application Firewall):** Tường lửa bảo vệ ứng dụng Web.
- **SCIM (System for Cross-domain Identity Management):** Giao thức đồng bộ tài khoản người dùng tự động.
- **mTLS (Mutual TLS):** Mã hóa và xác thực bảo mật kết nối hai chiều.
- **GA (General Availability):** Trạng thái phát hành chính thức rộng rãi.
- **PR (Pull Request):** Yêu cầu hợp nhất mã nguồn trên Git.
- **SIEM (Security Information and Event Management):** Quản lý sự kiện và an ninh thông tin tập trung.
- **CRUD (Create, Read, Update, Delete):** Các thao tác cơ bản với dữ liệu (Thêm, Đọc, Sửa, Xóa).

## Sức khỏe của các nhóm quản trị (F01 - F20)

| Nhóm tính năng | Nhóm giao diện | Trạng thái Lepos hiện tại | Điểm yếu cốt lõi | Áp lực cạnh tranh |
|---|---|---|---|---|
| `F01` Core Portal, cấu hình | `U01/U02` | `Product-ready` | Tối ưu hóa dữ liệu hiển thị | Vercel, Railway và Firebase đều có bảng điều khiển tài khoản và dự án cực kỳ trưởng thành. |
| `F02` Deployments, hàng đợi | `U03` | `Product-ready` | Quy trình tạo preview tự động dựa trên Git | Cao: Quy trình preview của Vercel, môi trường PR của Railway rất mạnh. |
| `F03` Tên miền và Edge cache | `U04` | `Product-ready/Beta` | Luồng dự phòng SSL native vẫn đang mô phỏng | Rất cao: Tên miền, SSL và CDN là tiêu chuẩn bắt buộc của ba đối thủ. |
| `F04` Giám sát, crash logs | `U05` | `Product-ready` | Logs trung tâm phụ thuộc vào logs drain Vercel | Cao: Vercel và Railway có luồng logs/observability rất mạnh. |
| `F05` Nhật ký kiểm toán, SCIM | `U06` | `Beta` | SCIM đồng bộ thư mục vẫn dùng Simulator nhập tay | Trung bình - cao: Vercel hỗ trợ audit/directory chuẩn doanh nghiệp. |
| `F06` Thiết bị kết nối | `U08` | `Control-plane` | Cần xác thực nhịp tim thật và bảo mật thiết bị | Thấp: Các đối thủ cạnh tranh không cung cấp giao diện nhịp tim thiết bị. |
| `F07` Chợ ứng dụng đối tác | `U07` | `Product-ready/Beta` | Chiều sâu đối soát tài chính và giải quyết tranh chấp | Trung bình: Vercel Marketplace và Firebase Extensions có hệ sinh thái lớn. |
| `F08` Tường lửa WAF bảo mật | `U08` | `Beta` | Cần xác thực logs sự kiện thật từ gateway | Cao đối với Vercel Firewall; thấp hơn đối với Railway/Firebase. |
| `F09` Định tuyến và bản sao | `U09` | `Beta` | Cần chạy thử nghiệm tải thực tế đa vùng | Trung bình - cao: Vercel có mô hình phân phối lưu lượng toàn cầu. |
| `F10` Tự động khắc phục lỗi | `U09` | `Beta` | Kịch bản cần xác thực trong môi trường staging | Khác biệt hóa: Các đối thủ không cung cấp giao diện tự chạy sửa lỗi. |
| `F11` FinOps và tiết kiệm carbon | `U09` | `Beta` | Dữ liệu carbon từ nhà cung cấp vẫn đang mô phỏng | Khác biệt hóa: Lập lịch theo carbon là tính năng độc đáo của Lepos. |
| `F12` Danh tính dịch vụ, Zero-Trust | `U10` | `Beta` | Cơ chế xoay vòng chứng chỉ thật chưa kết nối Client | Doanh nghiệp: Đối thủ bảo mật ở tầng mạng Cloud thay vì hiển thị giao diện. |
| `F13` Log Drains kết nối ngoài | `U11` | `Product-ready` | Cấu hình credentials của dịch vụ lưu trữ ngoài | Cao: Vercel integrations, Railway custom outputs hỗ trợ tốt. |
| `F14` Quản lý bản ghi DNS | `U12` | `Product-ready` | Đồng bộ hóa độ trễ phân giải DNS toàn cầu | Rất cao: DNS quản lý là table stakes đối với tất cả đối thủ. |
| `F15` Domain Registrar & Mua bán | `U13` | `Product-ready` | Bảng giá và thanh toán phụ thuộc API Vercel | Cao: Vercel Registrar và Google Domains cung cấp trải nghiệm mượt mà. |
| `F16` Edge Config Variables | `U14` | `Product-ready` | Đồng bộ dữ liệu biến tức thời lên CDN mạng biên | Cao: Vercel Edge Config lưu trữ khóa-giá trị cực nhanh. |
| `F17` Edge Config Schema | `U15` | `Product-ready` | Đồng bộ trực tiếp schema với UI kiểm thử | Trung bình: Validate cấu hình schema phân tán. |
| `F18` Edge Config Backups | `U16` | `Product-ready` | Lịch sử sao lưu cần lưu giữ an toàn lâu dài | Trung bình: Backups và rollback cấu hình store. |
| `F19` Access Groups phân quyền | `U17` | `Product-ready` | Ánh xạ đồng thời nhóm vào nhiều dự án khác nhau | Cao: Phân quyền cấp tổ chức / Teams của Vercel. |
| `F20` Domain Aliases & Webhooks | `U18/U19/U20`| `Product-ready` | Quản lý vòng đời gán/gỡ webhook trên Vercel | Cao: Webhooks thông báo trạng thái deploy/error sự cố. |

## Tóm tắt độ phủ giao diện điều khiển (U01 - U20)

| UI group | Các trang/views hiện có | Đánh giá độ phủ giao diện |
|---|---|---|
| `U01` Public/auth/docs | Marketing home, tài liệu hướng dẫn, login/register | Đầy đủ. |
| `U02` Dashboard/cài đặt | Tổng quan dashboard, cài đặt tài khoản, hiển thị | Đầy đủ. |
| `U03` Dự án và Deployments | Chi tiết dự án, tab triển khai, thăng cấp, logs | Product-ready: Custom modals, build logs stream, check runs list. |
| `U04` Tên miền & Edge cache | Cài đặt tên miền, xóa bộ đệm Edge cache | Product-ready: DNS, registrar, SSL Certs, Edge cache purges. |
| `U05` Giám sát/gỡ lỗi | Chi tiết lỗi, error tracker, crash panel, source maps | Product-ready: Error Tracker liên kết trực tiếp log; log drains. |
| `U06` Quản trị & SCIM | Audit logs không gian làm việc, cấu hình SCIM | Đầy đủ: Audit chạy thật; SCIM dán nhãn Simulator rõ ràng. |
| `U07` Chợ ứng dụng đối tác | Console nhà phát triển đối tác, payout, billing | Khung tốt; cần mở rộng đối soát tài chính. |
| `U08` Thiết bị & WAF | Quản lý thiết bị kết nối, bản đồ đe dọa WAF | Beta: Chỉ số nhịp tim động cho Connected Devices và WAF map. |
| `U09` Vận hành nâng cao | Tab định tuyến, mirrors, remediation, FinOps | Product-ready: Split NativePlatformTab sang sub-sidebar; Timeline. |
| `U10` Zero-trust | Danh tính dịch vụ, CA managed widget xoay vòng khóa | Beta: CA certs và nút xoay vòng khóa mô phỏng. |
| `U11` Log Drains | Tab cấu hình log drains, Datadog/Syslog, HTTPS endpoints | Product-ready: CRUD log drains, hiển thị trạng thái hoạt động. |
| `U12` DNS Records | Tab CRUD bản ghi DNS, bộ lọc loại bản ghi (A, CNAME) | Product-ready: CRUD bản ghi nhanh, kiểm tra verify trạng thái. |
| `U13` Domain Registrar | Tab tìm kiếm tên miền, xem bảng giá gia hạn/mua mới | Product-ready: Form đăng ký mua tên miền trực tiếp qua Vercel. |
| `U14` Edge Config Editor | Tab quản lý Edge Config Store, soạn thảo JSON | Product-ready: Editor trực quan sửa biến cấu hình phân tán. |
| `U15` Edge Config Schema | Tab định nghĩa schema cho cấu hình, validator JSON | Product-ready: Giao diện soạn thảo và validate schema của store. |
| `U16` Edge Config Backups | Tab danh sách sao lưu store, xem chi tiết thay đổi | Product-ready: Rollback cấu hình về phiên bản cũ. |
| `U17` Access Groups | Tab danh sách nhóm, thêm/xóa thành viên và dự án liên kết | Product-ready: CRUD Access Groups, quản lý phân quyền. |
| `U18` Account Aliases | Tab danh sách alias của tài khoản, gán alias cho deployment | Product-ready: Gán/gỡ alias trực tiếp. |
| `U19` Integrations | Tab các Add-ons và ứng dụng bên thứ ba đã cài đặt | Product-ready: Danh sách tích hợp tài khoản, quản lý cấu hình. |
| `U20` Webhooks Manager | Tab đăng ký URL webhook nhận sự kiện từ hệ thống | Product-ready: CRUD Webhooks nhận sự kiện thay đổi deploy. |

## Đối chiếu năng lực với các đối thủ cạnh tranh (20 Năng lực)

| Năng lực công nghệ | Lepos hiện tại | Vercel | Railway | Firebase Hosting / App Hosting |
|---|---|---|---|---|
| 1. Quy trình Deploy & Rollback | `Product-ready`; Tích hợp trigger, hủy build, stream logs, rollback qua SDK | `Competitor strong`; Quy trình build/deploy là thế mạnh | `Competitor strong`; Quản lý môi trường và triển khai nhanh | `Competitor strong`; Lịch sử phát hành Hosting App đồng bộ sâu |
| 2. Môi trường xem trước (PR) | `Beta`; Có UI quản lý nhưng quy trình tạo preview tự động cần chuẩn hóa | `Competitor strong`; Tự động tạo URL preview cho từng nhánh Git | `Competitor strong`; PR environments tự động theo cấu hình | `Competitor strong`; Hỗ trợ kênh preview channel tách biệt |
| 3. Tên miền & SSL | `Product-ready`; Định cấu hình DNS, mua tên miền, SSL và xóa cache CDN qua SDK | `Competitor strong`; Hạ tầng CDN toàn cầu và tự động cấp SSL | `Native`; Custom domains/SSL/networking là first-party | `Competitor strong`; Cấp phát chứng chỉ SSL và CDN mặc định |
| 4. Logs & Observability | `Product-ready`; Hỗ trợ log stream runtime, cấu hình log drains và timeline sự cố | `Competitor strong`; Phân tích hiệu năng và logs thời gian thực | `Competitor strong`; Hệ thống logs trung tâm và đo lường | `Adjacent/strong`; Sử dụng logs qua Google Cloud Logging |
| 5. Theo dõi lỗi & Source Maps | `Product-ready`; Quản lý source maps mạnh mẽ, xem code lỗi và liên kết log | `Adjacent`; Tích hợp tốt với các công cụ giám sát bên thứ ba | `Adjacent`; Thường chuyển tiếp dữ liệu qua OpenTelemetry | `Adjacent`; Tích hợp sâu với Firebase Crashlytics |
| 6. Kiểm toán & Governance | `Beta`; Nhật ký kiểm toán chạy thật; SCIM dán nhãn Simulator rõ ràng | `Competitor strong` đối với các tính năng doanh nghiệp | `Native/plan-dependent` quản trị theo gói | `Adjacent`; Quản lý tập trung qua Google Cloud Audit Logs |
| 7. Tường lửa WAF | `Beta`; Bản đồ đe dọa trực quan, nhịp tim hoạt động, cấu hình bypass IP | `Competitor strong`; Vercel Firewall/WAF chặn biên mạnh mẽ | `Not evidenced` chưa có giao diện tường lửa người dùng tự quản | `Not evidenced` chưa có UI cấu hình WAF trực tiếp trên Hosting |
| 8. Đa vùng & Failover | `Beta`; Tích hợp DNS engine, chính sách định tuyến và failover simulator | `Competitor strong`; Định tuyến anycast thông minh toàn cầu | `Competitor strong`; Hỗ trợ nhân bản dịch vụ đa vùng | `Native/adjacent`; Tự động phân phối tải CDN mặc định |
| 9. Chợ ứng dụng đối tác | `Product-ready/Beta`; Console đối tác hoạt động tốt; quy mô đối tác nhỏ | `Competitor strong`; Kho tích hợp bên thứ ba rất đa dạng | `Native/basic`; Triển khai nhanh qua kho templates chia sẻ | `Competitor strong`; Hệ thống Firebase Extensions rất phổ biến |
| 10. Bản sao phi tập trung | `Control-plane`; Cần kiểm chứng adapter IPFS/Arweave thực tế | `Not evidenced` chưa hỗ trợ | `Not evidenced` chưa hỗ trợ | `Not evidenced` chưa hỗ trợ |
| 11. Tự động khắc phục lỗi | `Beta`; Tích hợp kịch bản tự sửa chữa và dòng thời gian sự cố | `Adjacent`; Tự động khắc phục ở tầng hạ tầng đám mây ngầm | `Native/basic`; Tự động khởi động lại dịch vụ lỗi | `Adjacent`; Tự động co giãn và sửa lỗi qua Google Cloud |
| 12. Lập lịch FinOps giảm carbon | `Beta`; Thêm tab lập lịch và tín hiệu hàng đợi; dữ liệu carbon giả lập | `Adjacent`; Xem chi tiết hóa đơn, không tự lập lịch theo carbon | `Adjacent`; Hỗ trợ các công cụ tối ưu tài nguyên | `Adjacent`; Lập lịch/FinOps qua GCP carbon tools |
| 13. Zero-trust & Telemetry | `Beta`; CA managed widget và xoay vòng credentials mô phỏng hoạt động | `Managed security strong` cấu hình ngầm, không có UI này | `Adjacent`; Quản lý bảo mật kết nối nội bộ | `Adjacent`; Bảo mật qua GCP IAM và Secret Manager |
| 14. Kết nối Log Drains ngoài | `Product-ready`; Tích hợp Server Actions cấu hình Datadog, Syslog, HTTPS | `Competitor strong`; Log drains tích hợp sâu đối tác logs | `Competitor strong`; Gửi logs về bộ lưu trữ bên ngoài | `Adjacent`; Chuyển tiếp log qua GCP Pub/Sub |
| 15. Hệ thống bản ghi DNS | `Product-ready`; CRUD bản ghi DNS của bất kỳ tên miền nào đang quản lý | `Competitor strong`; Quản lý bản ghi DNS tại Edge CDN | `Competitor strong`; Cài đặt DNS tự động | `Competitor strong`; Phân giải DNS tự động trên Cloud |
| 16. Edge Config lưu trữ khóa | `Product-ready`; CRUD Config Stores, quản lý biến cấu hình phân tán | `Competitor strong`; Edge Config đồng bộ cực nhanh toàn cầu | `Competitor strong`; Biến môi trường đồng bộ tức thì | `Adjacent`; Runtime Config lưu trữ khóa-giá trị |
| 17. Config Schema Validator | `Product-ready`; Giao diện soạn thảo JSON Schema kiểm soát định dạng biến | `Competitor strong`; Schema validation cho Edge Config store | `Adjacent`; Cần tự validate biến môi trường bằng mã | `Adjacent`; Validate biến môi trường bằng schema GCP |
| 18. Edge Config Backups | `Product-ready`; Lưu trữ lịch sử thay đổi biến cấu hình và rollback | `Competitor strong`; Lịch sử sao lưu và khôi phục biến store | `Adjacent`; Lịch sử commit biến môi trường của dịch vụ | `Adjacent`; Sao lưu dữ liệu store qua Cloud Storage |
| 19. Access Groups phân quyền | `Product-ready`; CRUD access groups điều phối quyền theo dự án và teams | `Competitor strong`; Phân quyền nhóm làm việc cấp Enterprise | `Adjacent`; Phân quyền thành viên theo vai trò | `Adjacent`; Phân quyền người dùng qua GCP IAM |
| 20. Webhooks sự kiện | `Product-ready` Đăng ký và quản lý Webhooks sự kiện build/error | `Competitor strong`; Webhooks thông báo thay đổi trạng thái | `Competitor strong`; Webhooks gọi ngược khi deploy xong | `Adjacent`; Tích hợp webhook qua Cloud Functions |
