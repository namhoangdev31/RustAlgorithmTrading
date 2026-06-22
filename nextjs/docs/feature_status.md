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

### P0: Tránh tuyên bố phát hành chính thức giả lập (Avoid false GA claims)

- `[ ]` Thay thế việc cấp phát SSL mô phỏng bằng quy trình xác thực ACME/DNS thật và lịch sử vòng đời chứng chỉ.
- `[x]` Đánh dấu giao diện SCIM là sandbox/manual cho đến khi có luồng đồng bộ thực tế qua nhà cung cấp.
- `[x]` Đánh dấu mTLS/CA và xoay vòng chứng chỉ là mô phỏng rõ ràng trong giao diện Zero-Trust.
- `[x]` Bổ sung nhịp tim kết nối động (active heartbeats) cho bảng Connected Devices, WAF và Federated Routing.
- `[ ]` Bổ sung bằng chứng thực thi thực tế (runtime proof) cho các quyết định định tuyến tải.

### P1: Thu hẹp khoảng cách với nền tảng phát triển (Close parity gaps)

- `[x]` Kết nối trực tiếp nhật ký lỗi (Error details) với nhật trình log của Vercel/môi trường chạy để gỡ lỗi nhanh.
- `[x]` Chia nhỏ giao diện Native Platform quá tải thành các luồng chuyên biệt (Routing, Mirrors, Remediation, FinOps) thông qua sub-sidebar.
- `[x]` Tích hợp cấu phần dòng thời gian sự cố (Incident Timeline) hiển thị chéo sự kiện của WAF, failover, đồng bộ gương và khắc phục lỗi.
- `[ ]` Chuẩn hóa môi trường xem trước Git/PR với vòng đời URL, bảo mật, bình luận, logs và cơ chế promote/rollback.

### P2: Đưa các tính năng khác biệt lên tiêu chuẩn GA (Make differentiators GA)

- `[ ]` Xác thực việc xuất bản cấu phần artifact mirrors với các adapter IPFS/Arweave thật và kiểm thử gateway dự phòng.
- `[ ]` Chạy thử quy trình tự động khắc phục lỗi (Remediation approve/apply/rollback) trên môi trường staging với bằng chứng audit bất biến.
- `[ ]` Kết nối bộ lập lịch FinOps với nguồn cấp dữ liệu adapter chi phí và lượng carbon thực tế.
- `[ ]` Đo đạc hiệu năng mã hóa telemetry (homomorphic encryption) dưới dạng feature flag trước khi đưa vào sản xuất.

## Quy tắc duy trì tài liệu

1. Cập nhật tài liệu này theo mã nhóm tính năng `Fxx`, không sử dụng các nhãn giai đoạn mơ hồ.
2. Một nhóm tính năng chỉ được chuyển sang trạng thái `GA-ready in nextjs` khi luồng thành công chính không phải là mock/giả lập và có bằng chứng lưu trữ dữ liệu thật.
3. Nếu phần việc còn lại nằm ở `go`, `ops`, môi trường nhà cung cấp hoặc các kênh dữ liệu cầu nối/runtime, hãy giữ trạng thái là `Control-plane ready` hoặc `Beta`.
4. Sử dụng tài liệu `docs/uiux_status.md` để theo dõi độ sẵn sàng của trang/giao diện và tài liệu này để theo dõi độ hoàn thiện của tính năng/môi trường chạy.
