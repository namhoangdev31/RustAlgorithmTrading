# LepoS & LepoShip: Kế Hoạch Hoàn Thiện Tính Năng & Đánh Giá Giao Diện (Feature Gap & UI Analysis)

Tài liệu này tổng hợp toàn bộ các tính năng đang triển khai trong hệ thống LepoS/LepoShip. Hệ thống được đánh giá theo trạng thái: **Đã có giao diện (UI Implemented)**, **Chạy ngầm/Chưa có giao diện (Backend Only)** và **Nhu cầu bổ sung tương lai (Future Plan)** để phục vụ lên lộ trình phát triển tiếp theo.

---

## 1. Bản Đồ Hiện Trạng Tính Năng (Feature & UI Mapping)

### 1.1 Quản Lý Workspace & Thành Viên (RBAC)
*   **Đã có giao diện (UI)**:
    *   Thanh chuyển đổi Workspace (`app-sidebar.tsx` switcher dropdown).
    *   Trang quản lý thành viên, mời cộng tác viên và phân quyền vai trò (Owner/Admin/Editor/Viewer).
    *   Bảng điều khiển giới hạn tài nguyên và Plan sử dụng của Workspace (`workspace-governance-card.tsx`).
*   **Chạy ngầm / Chưa có giao diện**:
    *   Cơ chế soft-delete cascade xóa workspace và tự động xóa các projects/deployments liên quan.
    *   Quy trình chuyển nhượng quyền sở hữu Workspace (Transfer Ownership Server Action).
*   **Cần bổ sung trong tương lai**:
    *   **Giao diện Audit Log chuyên sâu**: Cung cấp bộ lọc theo thời gian, hành vi của user và xuất file báo cáo bảo mật trực tiếp trên UI.
    *   **Giao diện Form chuyển quyền sở hữu**: Cho phép chuyển nhượng Workspace trực tiếp qua Dashboard (thay vì gọi API/Action thủ công).

### 1.2 Tích Hợp Vercel SDK & Multi-Provider Config
*   **Đã có giao diện (UI)**:
    *   Tìm kiếm và liên kết Vercel Project.
    *   Xem danh sách Deployments (Promote, Rollback, Redeploy, Cancel).
    *   Quản lý tên miền (Add/Verify Custom Domain, xem DNS/TXT status và SSL status).
    *   Thao tác Biến môi trường (Env Vars) CRUD và import/export bulk.
    *   Trình soạn thảo JSON cho Edge Config (`EdgeConfigVarsCard`).
    *   Biểu đồ Analytics (Pageviews, Visitors, Referrers).
*   **Chạy ngầm / Chưa có giao diện**:
    *   Cơ chế đồng bộ hóa biến cấu hình Edge Config đa nền tảng (Replicate sang Cloudflare KV và Netlify).
    *   ACME client xác thực DNS challenge và gia hạn Let's Encrypt SSL tự động.
*   **Cần bổ sung trong tương lai**:
    *   **Giao diện Debug SSL**: Hiển thị chi tiết logs gia hạn chứng chỉ Let's Encrypt và thời hạn thực tế của cert.
    *   **Giao diện So sánh Môi trường**: So sánh trực quan cấu hình và lưu lượng mạng giữa Production, Preview, và Development.

### 1.3 LepoShip — Mobile WebView Builder & OTA
*   **Đã có giao diện (UI)**:
    *   Danh sách dự án di động LepoShip, giao diện cấu hình bundle tĩnh.
    *   Bảng điều khiển phân phối OTA (`lepoship-ota-controls.tsx`): Cấu hình tỉ lệ Rollout (%) và phân vùng phân phối theo quốc gia.
    *   Cài đặt cấu hình Runtime (minOsVersion, offline cache, custom ports).
    *   Terminal UI live console stream log build từ máy chủ (`lepoship-terminal.tsx`).
*   **Chạy ngầm / Chưa có giao diện**:
    *   Đóng gói web app tĩnh thành file zip (`lepoship-builder.ts`).
    *   Thuật toán so sánh vi sai Delta Patching để giảm 85% dung lượng cập nhật OTA.
    *   API phân phối bản cập nhật OTA thiết bị di động (`/api/bundles/check`).
*   **Cần bổ sung trong tương lai**:
    *   **Giao diện So sánh Build**: Thống kê và hiển thị trực quan dung lượng file thay đổi giữa bản build gốc và bản build Delta.
    *   **Giả lập thiết bị ảo (Interactive Emulator Wrapper)**: Hiển thị giao diện WebView chạy thử nghiệm trên màn hình điện thoại ảo trực quan ngay trên Dashboard để test nhanh bản build.

### 1.4 WebSocket Debug Bridge & Local Emulator
*   **Đã có giao diện (UI)**:
    *   Debug Console UI (`ide-debug-console.tsx`): hiển thị log realtime theo cấp độ severity (error, warning, info), thanh search, bộ lọc và nút toggle auto-scroll.
*   **Chạy ngầm / Chưa có giao diện**:
    *   WebSocket Server bridge trung chuyển logs từ emulator thông qua Redis (LPUSH/LTRIM).
    *   CLI tool command `diagnostics` để kiểm tra lỗi cục bộ.
*   **Cần bổ sung trong tương lai**:
    *   **Giao diện Quản lý thiết bị kết nối (Connected Devices UI)**: Hiển thị danh sách các thiết bị/simulator đang kết nối trực tiếp với WebSocket Bridge, trạng thái ping và thông tin thiết bị (OS, RAM, Model).

### 1.5 Error Tracking & Source Maps
*   **Đã có giao diện (UI)**:
    *   Trang quản lý lỗi (Issues Dashboard): hiển thị lỗi gộp theo fingerprint, thống kê trend tăng giảm của lỗi và cập nhật trạng thái xử lý (Resolved, Unresolved, Muted).
*   **Chạy ngầm / Chưa có giao diện**:
    *   Source map parser dịch ngược stack trace bị mã hóa ngược về dòng code gốc file `.ts`/`.tsx`.
*   **Cần bổ sung trong tương lai**:
    *   **Giao diện Quản lý Source Maps**: Hiển thị danh sách tệp `.map` đã upload, dung lượng và cho phép xóa/ghi đè.
    *   **Code Preview Inline**: Hiển thị trực tiếp đoạn code lỗi gốc (khoảng 10 dòng xung quanh vị trí lỗi) ngay trên Issues Dashboard giúp lập trình viên không cần mở IDE kiểm tra.

### 1.6 Plugin Marketplace
*   **Đã có giao diện (UI)**:
    *   Cửa hàng Marketplace: Tìm kiếm plugin, xem danh sách plugin, và gửi POST yêu cầu cài đặt/publish plugin.
*   **Chạy ngầm / Chưa có giao diện**:
    *   Động cơ sinh mã JS Bridge code tự động cho các custom plugins (`plugins.ts`).
*   **Cần bổ sung trong tương lai**:
    *   **Giao diện Partner Portal**: Cho phép các nhà phát triển bên thứ ba quản lý các plugin họ đã đăng, xem lượt tải, quản lý phiên bản (versioning) và update mô tả.
    *   **Giao diện Đánh giá & Bình luận**: Cho phép người dùng đánh giá sao (star rating) và viết nhận xét về các plugin trên store.

### 1.7 WAF Bot Mitigation & DDoS Protection (AI Shield)
*   **Đã có giao diện (UI)**:
    *   Quản trị luật tường lửa (Custom WAF Rules CRUD: `/waf/rules`).
*   **Chạy ngầm / Chưa có giao diện**:
    *   Heuristics quét JA3 fingerprint, kích hoạt proof-of-work JS challenge ngầm, và block IP tạm thời vào Redis.
*   **Cần bổ sung trong tương lai**:
    *   **Live Traffic Threat Map**: Giao diện bản đồ hiển thị trực quan nguồn gốc của các cuộc tấn công bot/DDoS đang bị chặn thời gian thực.
    *   **Thanh trượt Độ Nhạy WAF (Security Sensitivity)**: Nút trượt nhanh điều chỉnh độ nhạy (Low - Medium - High - Paranoid) thay vì phải tự viết các rule phức tạp.

### 1.8 Enterprise Directory Sync (SCIM 2.0)
*   **Đã có giao diện (UI)**:
    *   Tab cấu hình SSO (SAML/OIDC).
*   **Chạy ngầm / Chưa có giao diện**:
    *   REST SCIM API xử lý đồng bộ Users và Groups từ Azure AD / Okta, xác thực Bearer token.
*   **Cần bổ sung trong tương lai**:
    *   **Giao diện Cấu hình Directory Sync**: Nơi quản lý việc bật tắt đồng bộ, sinh SCIM credentials (Token, Tenant URL) để cấu hình phía Okta.
    *   **Giao diện SCIM Sync Logs**: Nhật ký hiển thị chi tiết lịch sử đồng bộ (thành công bao nhiêu user, thất bại lỗi gì).

### 1.9 AI DevOps Copilot & Diagnostics
*   **Đã có giao diện (UI)**:
    *   API chẩn đoán lỗi lịch sử, giao diện thu nhận feedback rating chẩn đoán của AI.
*   **Chạy ngầm / Chưa có giao diện**:
    *   LLM parser chẩn đoán error log và sinh bản vá sửa lỗi (patch diff).
*   **Cần bổ sung trong tương lai**:
    *   **Giao diện Áp Dụng Tự Động (One-click Apply)**: Hiển thị bản vá diff trực quan, có nút bấm tự động tạo Pull Request trên GitHub/Gitlab để áp dụng code fix mà không cần sửa code tay.
    *   **Chat DevOps Assistant**: Khung chat tích hợp ngay góc dashboard cho phép trao đổi trực tiếp với Copilot về tình trạng hạ tầng và đề xuất tối ưu.

---

## 2. Kế Hoạch Ưu Tiên Triển Khai Giai Đoạn Tiếp Theo

Dựa trên bảng phân tích khoảng cách tính năng trên, lộ trình ưu tiên bổ sung giao diện (Frontend Wiring) được thiết lập như sau:

| Độ ưu tiên | Tính năng cần bổ sung giao diện | Lý do |
|---|---|---|
| **Cao (P0)** | Giao diện cấu hình Directory Sync & sinh SCIM Token | Giúp khách hàng doanh nghiệp tự kết nối Okta/Azure AD mà không cần nhờ vả kỹ thuật can thiệp thủ công. |
| **Cao (P0)** | Giao diện Code Preview Inline (Error Tracking) | Tăng trải nghiệm sửa lỗi nhanh của developer, xem ngay dòng code lỗi trên UI. |
| **Trung bình (P1)** | Giao diện Quản lý thiết bị kết nối (WebSocket Bridge) | Giúp kiểm soát và gỡ lỗi (debug) thuận tiện trên nhiều máy ảo/thiết bị thật di động. |
| **Trung bình (P1)** | Giao diện Audit Log toàn cục | Đảm bảo tiêu chuẩn bảo mật cho khách hàng Enterprise. |
| **Thấp (P2)** | Giao diện Live Traffic Threat Map (WAF) | Tăng tính thẩm mỹ (wow factor) và trực quan hóa các đợt tấn công DDoS. |
| **Thấp (P2)** | Giao diện Partner Portal (Plugin Store) | Phục vụ giai đoạn mở rộng cổng đăng ký cho các developer bên thứ ba. |
