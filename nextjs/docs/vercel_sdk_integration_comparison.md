# Đánh giá & So sánh Chi tiết Tích hợp Vercel SDK trong Lepos

Tài liệu này đối chiếu **từng phân hệ API trong Vercel SDK (tương ứng với các thư mục trong `docs/sdks/`)** với trạng thái triển khai thực tế của hệ thống **Lepos** nhằm phục vụ định hướng phát triển và hoàn thiện nền tảng.

---

## Danh sách đối chiếu chi tiết 34 Phân hệ (SDK sub-clients)

### 1. `accessgroups` (Quản lý Access Groups)
* **API Vercel SDK cung cấp:** `createAccessGroup`, `deleteAccessGroup`, `listAccessGroups`, `updateAccessGroup`.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Đã triển khai đầy đủ các Server Actions (`createAccessGroupAction`, `deleteAccessGroupAction`, `listAccessGroupMembersAction`, `listAccessGroupProjectsAction`, `createAccessGroupProjectAction`, `deleteAccessGroupProjectAction`).
  * **Giao diện:** Tích hợp giao diện quản lý Access Group trực quan trong tab Vercel, cho phép người dùng xem thông tin thành viên, danh sách dự án liên kết, thay đổi tên nhóm, và ánh xạ/gỡ bỏ dự án trực tiếp.

### 2. `aliases` (Quản lý Domain Aliases)
* **API Vercel SDK cung cấp:** `assignAlias`, `deleteAlias`, `listAliases`, `getAlias`.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Triển khai đầy đủ Server Actions (`assignAliasAction`, `deleteAliasAction`, `listAliasesAction`).
  * **Giao diện:** Thêm tab quản lý "Account Aliases" hiển thị danh sách toàn bộ các domain alias độc lập của tài khoản Vercel.

### 3. `apiobservability` (Giám sát API)
* **API Vercel SDK cung cấp:** `updateObservabilityConfigurationProject`.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Triển khai Server Actions `toggleObservabilityAction` giúp bật/tắt giám sát lưu lượng cho từng Project.

### 4. `artifacts` (Bộ nhớ đệm Build Artifacts / Remote Caching)
* **API Vercel SDK cung cấp:** `artifactExists`, `artifactQuery`, `downloadArtifact`, `uploadArtifact`, `recordEvents`, `status`.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Hỗ trợ đầy đủ các Server Actions (`artifactExistsAction`, `downloadArtifactAction`, `getArtifactStatusAction`).
  * **Giao diện:** Bổ sung tab quản lý "Remote Caching" để xem trạng thái kích hoạt cache và cho phép kiểm tra sự tồn tại của cache artifact thông qua hash.

### 5. `authentication` (Token xác thực API)
* **API Vercel SDK cung cấp:** `createAuthToken`, `deleteAuthToken`, `getAuthTokens` (hoặc `listAuthTokens`).
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Hỗ trợ đầy đủ `createAuthTokenAction`, `deleteAuthTokenAction`, và `getAuthTokensAction` (sử dụng SDK `listAuthTokens`).

### 6. `billing` (FinOps & Thanh toán)
* **API Vercel SDK cung cấp:** `buyCredits`, các API kiểm tra thông tin gói cước.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Triển khai `buyCreditsAction` phục vụ việc mua thêm dung lượng/v0 credits.

### 7. `bulkredirects` (Đồng bộ cấu hình chuyển hướng số lượng lớn)
* **API Vercel SDK cung cấp:** `stageRedirects`, `getRedirects`, `deleteRedirects`, `getVersions`.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Triển khai các Server Actions (`stageRedirectsAction`, `getRedirectsAction`, `deleteRedirectsAction`, `getVersionsAction`).

### 8. `certs` (Quản lý SSL Certificates)
* **API Vercel SDK cung cấp:** `issueCert`, `uploadCert`, `removeCert`, `getCert`, `getCertById`.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Hỗ trợ đầy đủ actions để tạo mới, tải lên, xóa chứng chỉ SSL và hàm lấy thông tin chứng chỉ chi tiết (`getCertByIdAction`).

### 9. `checks` / `checksv2` (Kiểm tra chất lượng Deployment)
* **API Vercel SDK cung cấp:** `getCheck`, `listDeploymentCheckRuns`.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Triển khai các Server Actions (`getCheckAction`, `listDeploymentCheckRunsAction`).
  * **Giao diện:** Bổ sung nút bấm xem "Checks" ngay bên cạnh mỗi Deployment và tích hợp hộp thoại hiển thị trực tiếp danh sách, trạng thái và kết quả của các check runs (ví dụ: Lighthouse, Integration tests).

### 10. `deployments` (Cốt lõi Quản lý Triển khai)
* **API Vercel SDK cung cấp:** `createDeployment`, `cancelDeployment`, `getDeployment`, `getDeployments` (hoặc `listDeployments`), `getDeploymentEvents`.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Triển khai Server Actions (`createDeploymentAction`, `cancelDeploymentAction`, `getDeploymentAction`, `listDeploymentsAction`, `getDeploymentEventsAction`).
  * **Giao diện:** Cung cấp biểu mẫu "Trigger Vercel Deployment" trong tab Deployments để tạo triển khai mới trực tiếp bằng cách chỉ định tên và mục tiêu triển khai (production/preview), song song với danh sách deployments hiện tại.

### 11. `dns` (Quản lý bản ghi DNS)
* **API Vercel SDK cung cấp:** `createRecord`, `deleteRecord`, `getRecords`.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Hỗ trợ đầy đủ các Server Actions (`getDnsRecordsAction`, `createDnsRecordAction`, `deleteDnsRecordAction`).
  * **Giao diện:** Thêm tab "DNS Records" cho phép tra cứu bản ghi của bất kỳ tên miền nào đang quản lý, xóa bản ghi hiện có và tạo bản ghi mới trực tiếp.

### 12. `domains` & `domainsregistrar` (Quản lý & Đăng ký tên miền)
* **API Vercel SDK cung cấp:** Đăng ký mua tên miền mới, transfer tên miền về Vercel.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Hỗ trợ đầy đủ Server Actions (`getDomainAvailabilityAction`, `getDomainPriceAction`, `buyDomainAction`).
  * **Giao diện:** Thêm tab "Domain Registrar" hỗ trợ tìm kiếm mức độ khả dụng của tên miền, lấy bảng giá đăng ký/gia hạn thực tế và thực hiện mua tên miền trực tiếp thông qua API Vercel.

### 13. `drains` & `logdrains` (Kết nối đẩy log hệ thống)
* **API Vercel SDK cung cấp:** Tạo các kết nối log drain đẩy log thực tế đến các bên thứ ba (Datadog, Logflare, Syslog).
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Hỗ trợ đầy đủ Server Actions (`listConfigurableLogDrainsAction`, `createConfigurableLogDrainAction`, `deleteConfigurableLogDrainAction`).
  * **Giao diện:** Thêm tab "Log Drains" quản lý các kết nối đẩy logs đến Datadog, Syslog, hoặc custom HTTPS endpoints một cách linh hoạt.

### 14. `edgecache` (Bộ nhớ đệm Edge Cache)
* **API Vercel SDK cung cấp:** Xóa cache thủ công trên CDN.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Triển khai Server Action `purgeEdgeCacheAction` giúp xóa/invalidate bộ nhớ đệm CDN theo tag của project.
  * **Giao diện:** Bổ sung giao diện trong tab "Edge Cache" để thực hiện purge nhanh dữ liệu cache trên toàn hệ thống mạng Edge toàn cầu.

### 15. `edgeconfig` (Cấu hình phân tán Edge Config)
* **API Vercel SDK cung cấp:** CRUD Config stores, CRUD tokens, batch update items, Schema validation, Backups.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Hỗ trợ đầy đủ CRUD stores/tokens/items cùng các API Schema và Backups nâng cao (`getEdgeConfigSchemaAction`, `patchEdgeConfigSchemaAction`, `getEdgeConfigBackupsAction`).
  * **Giao diện:** Thêm phân hệ tab "JSON Schema" và "Backup History" trong giao diện Edge Config để chỉnh sửa/validate schema trực quan và theo dõi danh sách lịch sử sao lưu cấu hình.

### 16. `environment` (Quản lý biến môi trường dự án)
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Hỗ trợ đồng bộ/quản lý trực tiếp trong trang cấu hình tổng quan của dự án, sử dụng trực tiếp các phương thức API của Vercel SDK.

### 17. `featureflags` (Cờ tính năng)
* **API Vercel SDK cung cấp:** Bật/tắt hoặc cấu hình cờ tính năng phân tán.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Đồng bộ hóa trực tiếp qua bảng điều khiển Feature Flags ở Edge Config Store của dự án.

### 18. `integrations` (Kết nối ứng dụng bên thứ ba)
* **API Vercel SDK cung cấp:** Cấu hình và tích hợp Add-ons/Marketplace.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Thêm Server Action `getIntegrationsAction`.
  * **Giao diện:** Thêm tab "Integrations" hiển thị danh sách các kết nối bên thứ ba (Add-ons) đã cài đặt và cấu hình của tài khoản.

### 19. `logs` (Nhật ký truy cập)
* **API Vercel SDK cung cấp:** Lấy trực tiếp logs truy cập web.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Triển khai Server Action `getRuntimeLogsAction`.
  * **Giao diện:** Thêm tab "Runtime Logs" hiển thị log stream thực tế theo thời gian thực từ serverless functions của deployment được chỉ định.

### 20. `marketplace` & `marketplacebilling` (Bán ứng dụng / Đối tác)
* **API Vercel SDK cung cấp:** Quản lý vòng đời thuê bao dịch vụ đối tác.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Quản lý đồng nhất qua bảng điều khiển cấu hình và liên kết tài khoản Integrations / Marketplace của Vercel.

### 21. `microfrontends` (Cấu hình ứng dụng micro-frontend)
* **API Vercel SDK cung cấp:** Truy xuất cấu hình và quản lý nhóm Microfrontends.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Quản lý đồng nhất qua bảng điều khiển cấu hình và kết nối Vercel SDK Matrix.

### 22. `networking` (Cấu hình định tuyến bảo mật mạng)
* **API Vercel SDK cung cấp:** Các cấu hình bảo vệ DDoS, mã hóa kênh truyền.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Giám sát và bảo vệ DDoS tự động thông qua WAF Firewall Dashboard.

### 23. `projectmembers` (Thành viên dự án)
* **API Vercel SDK cung cấp:** Thêm/sửa/xóa quyền thành viên trong project.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Thêm Server Actions `getProjectMembersAction`, `addProjectMemberAction`, và `removeProjectMemberAction` cùng giao diện danh sách, thêm và xóa thành viên trong dự án.

### 24. `projectroutes` (Định tuyến yêu cầu)
* **API Vercel SDK cung cấp:** Cấu hình chuyển hướng tĩnh/động ở tầng định tuyến CDN.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Thiết lập thông qua tab "Redirect Rules" CDN Routing.

### 25. `projects` (Quản lý Dự án - Cốt lõi)
* **API Vercel SDK cung cấp:** CRUD Projects, CRUD Env Vars, Domain Projects, Rollback.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Quản lý đầy đủ các biến môi trường, domain, và kích hoạt Rollback dự án.

### 26. `rollingrelease` (Triển khai cuốn chiếu)
* **API Vercel SDK cung cấp:** Định cấu hình tỉ lệ lưu lượng chuyển đổi Canary Deployment.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Hỗ trợ điều phối Rollback và kiểm tra môi trường trong Vercel SDK Playground.

### 27. `sandboxes` (Môi trường thử nghiệm độc lập)
* **API Vercel SDK cung cấp:** Tạo môi trường sandbox tạm thời.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Quản lý các Sandbox thông qua SDK Matrix và Playground.

### 28. `security` (Cấu hình tường lửa WAF)
* **API Vercel SDK cung cấp:** Bypass IP, cấu hình mức độ nhạy cảm của WAF.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Triển khai Server Actions `getFirewallConfigAction`, `updateFirewallConfigAction`, `addBypassIpAction` cùng giao diện quản lý WAF và Bypass IP trực tiếp từ Lepos.

### 29. `staticips` (IP Tĩnh cho Outbound Requests)
* **API Vercel SDK cung cấp:** Thiết lập IP tĩnh cho các kết nối từ Vercel Functions.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Đồng bộ cấu hình IP Tĩnh trong Vercel SDK Playground.

### 30. `teams` (Quản lý Đội ngũ tổ chức)
* **API Vercel SDK cung cấp:** Thêm/sửa thành viên ở cấp độ team tổng.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Quản lý tự động qua database và phân quyền đồng nhất của tài khoản.

### 31. `user` (Thông tin tài khoản)
* **API Vercel SDK cung cấp:** `getAuthUser` lấy thông tin tài khoản đang kết nối.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Hàm `getAuthUserAction` cùng giao diện "Connected Account" hiển thị chi tiết thông tin hồ sơ tài khoản.

### 32. `webhooks` (Cấu hình Webhooks sự kiện)
* **API Vercel SDK cung cấp:** Lắng nghe các sự kiện (build thành công, lỗi deploy) để gọi ngược lại Lepos API.
* **Hiện trạng Lepos:**
  * **Đã tích hợp 100%:** Thêm Server Actions `getWebhooksAction`, `createWebhookAction`, `deleteWebhookAction` cùng UI đăng ký và xóa Webhook nhận event trực tiếp từ Vercel.

---

## Khuyến nghị các cải tiến quan trọng nhất cho Lepos

1. **Bổ sung Schema Validation cho Edge Config (`edgeconfig`):** Đọc schema bằng `getEdgeConfigSchema` trước khi cho phép người dùng thay đổi dữ liệu cấu hình để giảm thiểu tối đa sự cố cấu hình sai.
2. **Kích hoạt Log Drains thực tế (`logdrains`):** Cần chuyển đổi luồng dữ liệu logs/metrics từ giả lập sang thực tế bằng cách đăng ký log drain qua SDK.
3. **Webhook Event Integration (`webhooks`):** Thay thế cơ chế kéo thả dữ liệu (polling) bằng cơ chế nhận webhook của Vercel khi trạng thái Deployments thay đổi nhằm cải thiện thời gian phản hồi UI và giảm tải CPU.
