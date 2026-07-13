# LepoShip vs. Google Play Console & Apple App Store Connect: 24 Core Features Technical Playbook & Roadmap

Tài liệu này cung cấp **kế hoạch triển khai kỹ thuật chi tiết (Technical Playbook)** và **bảng đối chiếu trực quan (Comparison Matrix)** cho **24 tính năng cốt lõi** liên quan đến việc quản lý, phân phối, bảo mật và thương mại hóa ứng dụng (**Bundles**) trên LepoShip so với **Google Play Console** và **Apple App Store Connect**. 

Các mô hình (Models), lô-gích xử lý (Logic) và giao diện (UI) dưới đây được ánh xạ chính xác từ mã nguồn thực tế của hệ thống LepoShip.

---

## 1. Lưu trữ & Lịch sử Phiên bản (Version History)
*   **Mô tả**: Lưu trữ thông tin phát hành, số hiệu bản dựng (build number) tự tăng, phiên bản ngữ nghĩa (Semantic version) và liên kết tệp tin bundle tải lên.
*   **Điểm đánh giá thực tế**: **8.5 / 10** (quản lý bản phát hành rất chặt chẽ).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Định dạng file lưu trữ** | Tệp `.zip` WebView tĩnh lưu trên CDN và ghi nhận qua `BundleReleases`. | Gói nhị phân `.aab` (Android App Bundle) hoặc `.apk`. | Gói nhị phân `.ipa` được biên dịch và đóng gói sẵn. |
| **Quy tắc phiên bản** | Build Number tự tăng độc lập với Version String (v1.0.0). | Version Code bắt buộc tăng dần trên mọi kênh phân phối. | Build Number duy nhất đi kèm mỗi Version String. |
| **Xác thực bảo mật** | Hệ thống so khớp phiên bản, kiểm duyệt trước khi kích hoạt `BundleReleaseStatus`. | Khóa ký ứng dụng (App Signing Key) mã hóa bảo mật của Google. | Chữ ký điện tử của nhà phát triển được Apple xác thực. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `Bundles`: Quản lý chung thông tin dự án bundle.
    *   `BundleReleases`: Lưu lịch sử từng bản build (`id`, `version`, `buildNumber`, `status` [queued, building, success, failed], `sourceCommit`, `releaseNotes`, `createdAt`).
    *   `BundleArtifacts`: Lưu file path cụ thể của các artifact nén.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Khi tải lên tệp bundle qua endpoint, hệ thống tạo bản ghi `BundleReleases` ở trạng thái `queued` hoặc `building`.
    2. Sau khi biên dịch thành công, đổi trạng thái sang `success` và lưu thông tin vị trí tệp vào `BundleArtifacts`.
    3. Ngăn chặn việc tải lên bản build trùng lặp `buildNumber` hoặc hạ cấp phiên bản thông qua việc kiểm tra đối khớp số hiệu trong bảng `BundleReleases`.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/lepoship/[projectId]/builds`
    *   **UI Controls**: Bảng danh sách build (gồm cột: Build Number, Version, Source Commit, Trạng thái, Ngày đẩy). Có nút xem nhật ký biên dịch (Build Logs) trực tiếp.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Đồng bộ luồng hiển thị log biên dịch của build runner ra giao diện `/builds` thông qua websocket/SSE logs.
    2. Tạo nút tải trực tiếp artifact zip của từng build để debug cục bộ.

---

## 2. Kênh Phát hành & Cập nhật OTA (Release Tracks & OTA)
*   **Mô tả**: Phát hành các bản build khác nhau lên từng kênh riêng biệt (Production, Beta, Staging) để client tự động cập nhật.
*   **Điểm đánh giá thực tế**: **8.5 / 10** (OTA phân phối rất linh hoạt).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Tốc độ cập nhật** | Tức thời (Real-time). Client gọi API poll và tải về trong vài giây. | Chậm. Phải thông qua kho ứng dụng Google Play Store cập nhật. | Chậm. Phải thông qua App Store cập nhật ngầm. |
| **Kênh phát hành** | Quản lý động qua `BundleChannels` và `BundleReleases`. | Kênh tĩnh cố định (Production, Open Beta, Closed Beta, Internal). | Phân phối qua TestFlight (External/Internal Groups). |
| **Kiểm duyệt cập nhật** | Bỏ qua hoàn toàn bước kiểm duyệt đối với các bản hotfix. | Bắt buộc kiểm duyệt lại toàn bộ gói nhị phân cho mọi cập nhật. | Bắt buộc kiểm duyệt lại toàn bộ gói nhị phân cho mọi cập nhật. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleChannels`: Quản lý các kênh phân phối (`id`, `bundleId`, `name` [Production, Beta], `currentReleaseId`, `isActive`).
    *   `BundleReleases`: Liên kết với `BundleChannels` qua trường `channelId`.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Khi thiết bị gọi API check update, server truy vấn `BundleChannels` đang active.
    2. Kiểm tra bản build hiện tại của client (`currentBuildNumber`) so với `currentReleaseId` trên kênh tương ứng.
    3. Trả về downloadUrl mới nếu phát hiện có bản build cao hơn đang kích hoạt trên kênh.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/lepoship/[projectId]/ota`
    *   **UI Controls**: Giao diện quản lý kênh (Channels): Hiển thị trạng thái kênh, build number đang chạy. Có nút "Promote" để chuyển nhanh bản build từ kênh Beta lên Production.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Đồng bộ luồng cập nhật `currentReleaseId` trong `BundleChannels` khi bấm nút Promote trên giao diện.
    2. Xây dựng bộ lọc chặn IP hoặc thiết bị thử nghiệm truy cập các kênh thử nghiệm nhạy cảm.

---

## 3. Biên dịch Gói vi sai (Delta Compilations)
*   **Mô tả**: Tự động so sánh bản build hiện tại của client với bản build mới nhất trên server để tạo tệp zip vi sai giúp tiết kiệm băng thông.
*   **Điểm đánh giá thực tế**: **8.5 / 10**.

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Giải thuật vi sai** | So sánh hash file tĩnh, chỉ gom file thay đổi nén lại thành zip nhỏ. | Gói AAB tự động tách nhỏ các split APKs theo cấu hình máy. | App Thinning tự cắt lát tài nguyên hình ảnh theo dòng thiết bị. |
| **Dung lượng tải** | Giảm tới **90%** dung lượng tải nếu chỉ sửa đổi nhỏ (HTML/JS). | Tối ưu hóa dung lượng cập nhật nhờ cơ chế nén nhị phân chênh lệch. | Tải tệp cấu hình tối giản tương ứng với phần cứng nhận dạng. |
| **Cơ chế Fallback** | Tự động trả về full zip nếu không tìm thấy tệp delta tương ứng. | Google Play tự động xử lý tải lại toàn bộ app nếu gói patch lỗi. | App Store tự động tải lại gói IPA đầy đủ nếu cài đặt lỗi. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleArtifactManifests`: Quản lý danh sách file hash trong build.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Khi build thành công phiên bản $N$, server so sánh cây hash file trong `BundleArtifactManifests` với phiên bản $N-1$.
    2. Tạo tệp vi sai chênh lệch lưu trên CDN.
    3. Khi check update, API tính toán khoảng cách build. Nếu có tệp vi sai tương ứng, trả về tệp vi sai kèm cờ `isDelta: true` để client giải nén đè lên bộ nhớ đệm.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/lepoship/[projectId]/builds`
    *   **UI Controls**: Hiển thị nhãn thông tin dung lượng tệp vi sai chênh lệch của từng build so với bản cũ hơn.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Viết API kiểm tra và trả về tệp vi sai tối ưu trong `/api/bundles/check`.
    2. Thống kê dung lượng tiết kiệm của delta updates trên biểu đồ tổng quan.

---

## 4. Triển khai Cuốn chiếu (Phased Rollouts)
*   **Mô tả**: Triển khai bản cập nhật dần dần theo tỷ lệ phần trăm người dùng để kiểm chứng lỗi.
*   **Điểm đánh giá thực tế**: **7.5 / 10** (đã tích hợp đầy đủ cơ chế phân nhóm cuốn chiếu).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Cơ chế phân nhóm** | Băm `rollout.id + installationId` qua SHA-256 để lấy chỉ số bucket (0-9999). | Phân bổ ngẫu nhiên dựa trên Google Play Services của thiết bị. | Triển khai tự động tăng % cố định theo lộ trình 7 ngày của Apple. |
| **Độ mịn phân phối** | Độ mịn lên tới **0.01%** (chia thành 10,000 bucket). | Thay đổi tỷ lệ phần trăm tùy ý. | Tỷ lệ tăng cố định mỗi ngày, không chỉnh sửa lẻ. |
| **Dừng khẩn cấp** | Trạng thái tạm ngưng (`paused`) chặn đứng phân phối tức thì. | Có nút dừng cập nhật bản phát hành lỗi. | Có nút tạm dừng Staged Rollout. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleDeliveryRollouts`: Quản lý thông tin chiến dịch rollout (`id`, `bundleId`, `channelId`, `baselineReleaseId`, `candidateReleaseId`, `percentage`, `status` [running, paused, completed]).
    *   `BundleDeliveryRolloutExposures`: Lưu vết thiết bị tiếp xúc với bản rollout (`id`, `rolloutId`, `installationId`, `releaseId`, `bucket`, `exposedAt`).
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Hàm `assignRolloutRelease` băm `rolloutId` và `installationId` thông qua SHA-256, chuyển đổi 4 byte đầu sang số nguyên và lấy dư cho `10,000`.
    2. Nếu `bucket < percentage * 100`, thiết bị nhận bản phát hành mới (`candidateRelease`), ngược lại nhận bản cũ (`baselineRelease`).
    3. Ghi nhận thông tin thiết bị đã tiếp xúc vào bảng `BundleDeliveryRolloutExposures` để kiểm soát nhất quán.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/lepoship/[projectId]/ota`
    *   **UI Controls**: Giao diện cấu hình phần trăm rollout (0-100%). Nút tạm dừng (Pause) và nút kích hoạt hoàn toàn 100% (Complete Rollout) để thay thế hoàn toàn bản build Production.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Thiết kế UI tạo chiến dịch Rollout giữa 2 bản build `baseline` và `candidate`.
    2. Tích hợp nút tạm dừng và chuyển đổi trạng thái rollout trực tiếp từ màn hình quản lý.

---

## 5. Thử nghiệm A/B (A/B Testing Engine)
*   **Mô tả**: Nền tảng thử nghiệm khoa học so sánh hiệu quả giữa phiên bản thử nghiệm (Variant B) và đối chứng (Variant A) tích hợp các kiểm định thống kê.
*   **Điểm đánh giá thực tế**: **9.5 / 10** (Engine thống kê cực kỳ chuyên sâu và trực quan).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Chỉ số khoa học** | SRM (Sample Ratio Mismatch) Chi-Square, t-test, Bayesian posterior probability. | Chỉ số lượt tải và gỡ cài đặt thô. | Tỷ lệ chuyển đổi (conversion rate), mức tăng trưởng (lift) và độ tin cậy. |
| **Tự động bảo vệ** | Tự động tạm dừng thử nghiệm (Guardrail) nếu tỷ lệ crash ở Variant B tăng đột biến. | Không hỗ trợ tự động dừng (phải theo dõi Android Vitals và tắt tay). | Không hỗ trợ tự động dừng (phải theo dõi thủ công). |
| **Đóng băng Control** | Đóng băng cố định phiên bản build của cả A và B khi bắt đầu test. | Nhóm đối chứng tự động cập nhật theo bản phát hành trực tuyến hiện tại. | Nhóm đối chứng tự động áp dụng thông tin trang sản phẩm hiện tại. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleAbTests`: Lưu cấu hình thử nghiệm, giả thuyết, metric mục tiêu, mẫu yêu cầu tối thiểu, trạng thái phân tích.
    *   `BundleAbTestExposures`: Lưu vết phân bổ thiết bị vào nhóm A hoặc B (`deviceId`, `variant`, `assignedReleaseId`, `bucket`, `platform`, `countryCode`, `locale`).
    *   `BundleAbTestAnalysisSnapshots`: Snapshot tính toán chỉ số thống kê hàng ngày.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Khi gọi check update, hàm `assignExperimentRelease` băm `deviceId + test.id` để phân nhóm A/B ổn định theo tỷ lệ `trafficSplit`.
    2. Cron job `/api/cron/ab-experiments` chạy định kỳ gọi `analyzeExperiment` để tính toán:
        *   Tỷ lệ chuyển đổi (Conversion Rate) và Lift %.
        *   Giá trị p-value hai phía để xác định ý nghĩa thống kê.
        *   SRM p-value (Kiểm tra lệch tỷ lệ mẫu) sử dụng Chi-Square. Nếu $p < 0.001$, tự động dừng test.
        *   Crash Rate chênh lệch. Nếu Variant B crash nhiều hơn Variant A $\ge 2\%$ và $p < 0.05$ (kiểm định một phía), tự động kích hoạt **paused_guardrail** để bảo vệ người dùng.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/lepoship/[projectId]/ab-tests` và chi tiết `/ab-tests/[testId]`
    *   **UI Controls**: Trang chi tiết hiển thị biểu đồ Recharts số lượng thiết bị tiếp cận, bảng so sánh chi tiết các chỉ số thống kê (Exposed, Conversions, Crash Rate, Lift %, P-value, SRM Health, Bayesian Posterior P(B>A)). Nút "Apply Winner" kích hoạt thăng cấp build.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Đã triển khai xong Engine xử lý thống kê tại `lib/server/ab-testing/analysis.ts`.
    2. Cập nhật giao diện chi tiết `/ab-tests/[testId]/page.tsx` hiển thị đầy đủ các chỉ số thống kê nâng cao.

---

## 6. Tích hợp Biên dịch Tự động (Build integrations)
*   **Mô tả**: Tự động liên kết kho mã nguồn Git và điều phối tiến trình biên dịch đóng gói WebView bundle.
*   **Điểm đánh giá thực tế**: **7.5 / 10**.

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Liên kết mã nguồn** | Đồng bộ trực tiếp qua GitHub Webhook và repo Git. | Không hỗ trợ (phải tự upload gói đã compile bên ngoài). | Tích hợp qua Xcode Cloud (liên kết GitHub/Bitbucket). |
| **Trình biên dịch** | Chạy tiến trình đóng gói tự động trên máy chủ LepoShip Builder. | Nhà phát triển tự compile trên máy cá nhân hoặc CI/CD riêng. | Trình biên dịch đám mây chạy trên máy ảo macOS của Apple. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleBuildJobs`: Quản lý hàng đợi và logs biên dịch (`id`, `bundleId`, `status`, `logs`, `commitHash`, `createdAt`).
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Nhận thông tin git commit qua webhook hoặc yêu cầu build thủ công từ dev portal.
    2. Khởi tạo một job biên dịch, gọi scripts đóng gói WebView bundle, tạo file manifest danh sách file hash.
    3. Nén file zip, tải lên CDN và cập nhật trạng thái `BundleBuildJobs` sang `success`.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/lepoship/[projectId]/builds`
    *   **UI Controls**: Terminal log hiển thị log build chạy thời gian thực. Nút bấm "Trigger Build" chọn branch để kích hoạt build nhanh.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Hoàn thiện server action trigger build trực tiếp từ giao diện developer portal.
    2. Tích hợp hiển thị log streaming qua SSE/Websocket.

---

## 7. Cấu hình Ads & Mạng lưới Quảng cáo (Ad configs)
*   **Mô tả**: Cấu hình từ xa các tham số quảng cáo (AdMob App ID, Banner ID, Interstitial ID) của ứng dụng.
*   **Điểm đánh giá thực tế**: **8.0 / 10** (OTA phân phối ads cực kỳ trực quan).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Thay đổi Key** | Thay đổi từ xa qua giao diện Admin, cập nhật ngay lập tức. | Phải code cứng Key trong ứng dụng và đẩy bản build mới. | Phải code cứng Key trong ứng dụng và đẩy bản build mới. |
| **Bật tắt chế độ Test** | Hỗ trợ cờ Test Mode điều khiển từ xa để lập trình viên gỡ lỗi. | Phải đăng ký ID thiết bị test thủ công trong code. | Phải đăng ký ID thiết bị test thủ công trong code. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleAdConfigurations`: Quản lý mã quảng cáo (`id`, `bundleId`, `provider` [admob, unity], `appId`, `bannerId`, `interstitialId`, `isTestMode`, `isActive`).
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Tìm kiếm cấu hình quảng cáo tương ứng với `bundleId` trong DB.
    2. Trích xuất và chèn thông tin cấu hình này vào payload trả về của API check update khi client gọi kiểm tra OTA.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/lepoship/[projectId]/settings/ads`
    *   **UI Controls**: Biểu mẫu nhập các mã quảng cáo theo mạng lưới (AdMob, Unity, AppLovin). Checkbox bật tắt Test Mode và công tắc kích hoạt Active.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Đồng bộ luồng lưu cấu hình ads thông qua server action `saveAdConfigAction` đã viết.
    2. Kiểm tra định dạng chuỗi ID quảng cáo trước khi lưu để tránh lỗi runtime của SDK.

---

## 8. Hàng duyệt của Quản trị viên (Moderation Review Queue)
*   **Mô tả**: Quy trình kiểm duyệt phiên bản bundle mới của quản trị viên trước khi phát hành chính thức lên store.
*   **Điểm đánh giá thực tế**: **8.0 / 10**.

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Cơ chế duyệt** | Hàng duyệt tập trung sắp xếp theo độ ưu tiên và thời gian. | Hệ thống hàng đợi tự động kết hợp kỹ sư đánh giá. | Nhân viên kiểm duyệt Apple kiểm tra thủ công qua thiết bị thực tế. |
| **Lịch sử hoạt động** | Ghi nhận chi tiết lịch sử thao tác duyệt, duyệt bởi ai, lý do từ chối. | Báo cáo vi phạm chính sách gửi qua email. | Tin nhắn phản hồi qua Resolution Center. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleReviewQueue`: `id`, `bundleId`, `submittedReleaseId`, `priority`, `status` ("pending", "approved", "rejected"), `queueNotes`.
    *   `BundleReviewHistory`: `id`, `reviewQueueId`, `action` ("approve", "reject"), `reason`, `reviewerId`, `createdAt`.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Khi phê duyệt: Đổi trạng thái trong `BundleReviewQueue` sang `approved`, đồng thời chuyển `status` của `BundleReleases` sang `success`/`published` và ghi nhận lịch sử duyệt trong một database transaction.
    2. Khi từ chối: Đổi trạng thái hàng duyệt sang `rejected`, yêu cầu ghi nhận bắt buộc lý do từ chối vào bảng `BundleReviewHistory`.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/admin/review-queue`
    *   **UI Controls**: Bảng danh sách hàng đợi duyệt dành cho Admin. Có nút Approve (Xanh lá) và Reject (Đỏ, mở modal yêu cầu nhập lý do từ chối).
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Tích hợp logic gửi thông báo (email/in-app) cho developer ngay khi admin cập nhật trạng thái duyệt.
    2. Hiển thị thông số lịch sử quét bảo mật của bản build ngay trên màn hình hàng đợi duyệt.

---

## 9. Quét Bảo mật Mã nguồn (Security Scan Results)
*   **Mô tả**: Tự động phân tích các lỗ hổng mã nguồn tĩnh của tệp zip để phát hiện mã độc hoặc backdoor.
*   **Điểm đánh giá thực tế**: **6.0 / 10** (đã xây dựng bảng lưu trữ, quét tự động cơ bản).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Quét an toàn** | Hỗ trợ lưu trữ kết quả phân tích bảo mật sau biên dịch. | Google Play Protect quét mã độc tự động rất mạnh. | Kiểm tra chữ ký và đối chiếu mã nguồn API riêng tư. |
| **Xử lý vi phạm** | Gắn cờ cảnh báo lỗi bảo mật ngay tại hàng đợi duyệt của admin. | Từ chối phê duyệt bản dựng hoặc gỡ bỏ app ngay lập tức. | Từ chối phê duyệt bản dựng hoặc gỡ bỏ app ngay lập tức. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleSecurityScanResults`: `id`, `bundleId`, `buildNumber`, `score` (Int), `vulnerabilitiesFound` (JSON), `scanLog`, `status` ("passed", "failed", "warning").
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Tiến trình build kết thúc sẽ kích hoạt trình quét an toàn.
    2. Quét kiểm tra mã độc thông qua danh sách blacklisted keywords/patterns và thư viện npm lỗi thời.
    3. Lưu log chi tiết vào `BundleSecurityScanResults` để admin làm căn cứ phê duyệt hoặc từ chối bundle.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: Trong trang duyệt `/admin/review-queue` và trang lịch sử build của dev.
    *   **UI Controls**: Biểu tượng nhãn cảnh báo bảo mật (Passed màu xanh, Warning màu vàng, Failed màu đỏ). Có nút bấm xem log quét chi tiết.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Tích hợp script quét an toàn tĩnh vào chuỗi build tự động của server builder.
    2. Ngăn chặn tự động việc xuất bản bản build có trạng thái quét là `failed`.

---

## 10. Ghi nhận & Gỡ lỗi Crash (Crash Reports Diagnostics)
*   **Mô tả**: SDK tự động bắt lỗi runtime đột ngột và gửi về hệ thống để nhà phát triển phân tích.
*   **Điểm đánh giá thực tế**: **6.5 / 10** (đã có hệ thống log crash chi tiết kết nối trực tiếp với ranking score).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Ánh xạ dòng code** | Log lỗi runtime được lưu trữ theo build number tương ứng. | Sử dụng file ProGuard mapping để giải mã stack trace. | Sử dụng file dSYM để giải mã crash log của iOS/macOS. |
| **Hệ quả hiệu năng** | Tỷ lệ crash tăng cao sẽ trực tiếp làm giảm vị trí đề xuất trên store. | Android Vitals cảnh báo nếu tỷ lệ crash vượt ngưỡng an toàn. | Giảm thứ hạng hiển thị nếu app phát sinh nhiều crash. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleCrashReports`: `id`, `bundleId`, `buildNumber`, `errorMessage`, `stackTrace`, `isResolved`, `resolvedAt`, `resolvedBy`, `createdAt`.
    *   `BundleCrashEvents`: Dữ liệu crash thô của thiết bị phục vụ thống kê A/B test.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Client gửi log lỗi qua endpoint API.
    2. Server lưu trữ lỗi vào bảng `BundleCrashReports` và cập nhật chỉ số chất lượng trong bảng xếp hạng.
    3. Hỗ trợ nhà phát triển đánh dấu trạng thái lỗi (`isResolved = true`) sau khi đẩy bản sửa lỗi mới.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/lepoship/[projectId]/crashes`
    *   **UI Controls**: Bảng thống kê lỗi crash nhóm theo nội dung lỗi, số lượt gặp lỗi, danh sách thiết bị bị ảnh hưởng và nút "Mark as Resolved".
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Thiết kế trang quản lý crash `/crashes` hiển thị trực quan thông tin lỗi.
    2. Bổ sung tính năng upload Source Map để tự động giải mã stack trace của file Javascript đã minify.

---

## 11. Phân quyền Thành viên Dự án (Collaborators & Permissions)
*   **Mô tả**: Quản lý thành viên tham gia phát triển dự án ứng dụng và giới hạn tác vụ của từng người.
*   **Điểm đánh giá thực tế**: **8.0 / 10** (phân quyền chặt chẽ thông qua nhóm vai trò).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Độ chi tiết quyền** | 4 nhóm quyền tĩnh tương ứng các chức năng cốt lõi. | Phân quyền chi tiết cho từng hành động quản trị viên. | Phân quyền theo vai trò (Finance, Developer, App Manager). |
| **Bảo vệ tác vụ** | Middleware kiểm tra quyền hạn trước khi biên dịch hoặc thay đổi store. | Chặn quyền xuất bản của các tài khoản thử nghiệm. | Giới hạn quyền truy cập mã nguồn và bản phát hành của tài khoản. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleCollaborators`: `bundleId`, `userId`, `role` ("admin", "editor", "viewer"), `permissionKeys` (String[]).
    *   `BundlePermissions`: Ghi nhận các khóa quyền cụ thể (`build:trigger`, `listing:edit`, `collaborators:manage`, `billing:manage`).
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Trước khi thực thi tác vụ nhạy cảm, gọi hàm `requireProjectRole` để xác định vai trò của người dùng hiện tại đối với dự án.
    2. Đối chiếu vai trò với bảng quyền `PERMISSION_GROUPS` (ví dụ quyền trigger build yêu cầu tối thiểu vai trò `build_trigger_only`).
    3. Nếu không hợp lệ, trả về lỗi truy cập từ chối ngay lập tức.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/projects/[projectId]/members`
    *   **UI Controls**: Danh sách thành viên kèm bộ chọn vai trò (Dropdown). Nút "Invite Member" gửi thư mời thành viên mới tham gia dự án.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Đồng bộ hệ thống kiểm tra quyền vào các API server action của dự án.
    2. Xây dựng form gán vai trò trực tiếp trên màn hình quản lý thành viên.

---

## 12. Bộ máy Xếp hạng Bayesian & Trending (Ranking Scores)
*   **Mô tả**: Thuật toán tự động tính toán vị trí hiển thị của ứng dụng trên cửa hàng dựa trên các tiêu chí chất lượng tổng hợp.
*   **Điểm đánh giá thực tế**: **8.0 / 10** (thuật toán Bayesian minh bạch và ổn định).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Giải thuật xếp hạng** | Bayesian Average (m = 10, C = 3.5) kết hợp độ phổ biến log-normalized. | Thuật toán xếp hạng bí mật của Google dựa trên nhiều yếu tố. | Thuật toán xếp hạng bí mật của Apple dựa trên velocity tải ứng dụng. |
| **Hình phạt lỗi** | Tự động hạ cấp vị trí hiển thị trên Store nếu tỷ lệ crash tăng cao. | Ẩn hoặc giảm đề xuất nếu app hoạt động không ổn định. | Ẩn hoặc giảm đề xuất nếu app hoạt động không ổn định. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleRankingScores`: `id`, `bundleId`, `popularityScore`, `retentionScore`, `qualityScore`, `crashScore`, `overallScore`, `updatedAt`.
    *   `BundleTrendingSnapshots`: `id`, `bundleId`, `snapshotDate`, `downloadCount`, `activeInstalls`, `rankPosition`, `category`.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Cron job `/api/cron/ranking-calculator` chạy định kỳ tính toán điểm xếp hạng.
    2. Tính điểm chất lượng thông qua công thức Bayesian Average dựa trên lượng reviews và sao trung bình.
    3. Tính điểm độ phổ biến thông qua lượng cài đặt hoạt động (`activeInstalls`) và số đơn hàng (`orders`). Khấu trừ điểm phạt nếu tỷ lệ lỗi crash vượt ngưỡng.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/marketplace/analytics` hoặc trang chủ store.
    *   **UI Controls**: Hiển thị thứ hạng hiện tại của app trong danh mục. Biểu đồ đường vẽ xu hướng thay đổi thứ hạng hàng tuần.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Đã triển khai xong thuật toán tính điểm xếp hạng tại cron `/api/cron/ranking-calculator`.
    2. Đồng bộ kết quả sắp xếp của API Store theo điểm `overallScore`.

---

## 13. Rút tiền & Monetization Connect (Stripe Connect Accounts)
*   **Mô tả**: Thiết lập liên kết ví Stripe Connect Express và thực hiện chuyển tiền doanh thu từ tài khoản LepoShip sang tài khoản đối tác.
*   **Điểm đánh giá thực tế**: **8.5 / 10** (luồng giải ngân trực tuyến hoàn chỉnh).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Cổng thanh toán** | Stripe Connect (Express) chia dòng tiền tự động. | Google Merchant Services thu tiền và thanh toán định kỳ. | Apple StoreKit thanh toán định kỳ qua tài khoản ngân hàng. |
| **Thời gian nhận** | Chuyển thẳng về ví Stripe Express của đối tác trong vài ngày. | Trả tiền hàng tháng vào ngày 15. | Trả tiền hàng tháng theo lịch tài khóa riêng. |
| **Tỷ lệ chiết khấu** | Phân phối 30% platform fee / 70% transfer hoặc cấu hình tùy ý. | 15% - 30% hoa hồng cố định. | 15% - 30% hoa hồng cố định. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `MarketplacePartnerAccount`: `id`, `workspaceId`, `stripeAccountId`, `isOnboardingCompleted`.
    *   `BundlePayouts`: `id`, `developerId`, `workspaceId`, `amount`, `currency`, `status` ("pending", "completed", "failed"), `stripePayoutId`, `createdAt`.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Khi mua app, Stripe PaymentIntent tạo ra đơn hàng với cấu trúc chuyển tiền tự động (`transfer_data` tới `stripeAccountId` của đối tác) đồng thời khấu trừ hoa hồng làm phí nền tảng (`application_fee_amount`).
    2. API hỗ trợ lấy số dư khả dụng (`getPartnerBalance`) và lịch sử rút tiền (`getPartnerPayouts`) trực tiếp từ Stripe API của Connected Account.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/marketplace/billing` và `/admin/finance`
    *   **UI Controls**: Tab Billing hiển thị số dư khả dụng, doanh số tích lũy, nút "Liên kết Stripe Connect" và bảng lịch sử giao dịch thanh toán.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Đồng bộ webhook Stripe Connect xử lý sự kiện hoàn tất onboarding của đối tác để mở khóa trạng thái thanh toán.
    2. Hoàn thiện giao diện hiển thị số dư Stripe thời gian thực.

---

## 14. Đơn hàng & License sử dụng (Orders & Entitlements)
*   **Mô tả**: Lưu trữ thông tin đơn hàng thanh toán thành công và cấp quyền truy cập WebView bundle tương ứng của người dùng.
*   **Điểm đánh giá thực tế**: **8.5 / 10** (quản lý quyền truy cập cực kỳ chặt chẽ).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Cơ chế cấp quyền** | Ghi nhận bản ghi `BundleUserEntitlements` ngay khi Stripe webhook hoàn tất. | Quản lý qua Google Play Licensing Library (LVL). | Quản lý qua App Store Server Receipts và StoreKit 2 APIs. |
| **Khóa quyền** | Chuyển trạng thái `isActive = false` tức thì khi đơn hàng bị hoàn tiền. | Tự động cập nhật trạng thái license qua Google Play Services. | Apple gửi thông báo hoàn tiền về server để khóa quyền. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleOrders`: `id`, `bundleId`, `userId`, `totalAmount`, `currency`, `status` ("completed", "refunded").
    *   `BundleUserEntitlements`: `id`, `userId`, `bundleId`, `orderId`, `entitlementType` ("one_time", "subscription"), `isActive`.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Webhook Stripe báo sự kiện `checkout.session.completed` thành công.
    2. Server tạo bản ghi đơn hàng trong `BundleOrders` và chèn bản ghi quyền sử dụng trong `BundleUserEntitlements` với trạng thái `isActive = true` trong một transaction.
    3. API check quyền `/api/bundles/verify-licence` kiểm tra xem người dùng hiện tại có bản ghi active tương ứng hay không trước khi trả về gói tải OTA.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/marketplace/billing`
    *   **UI Controls**: Bảng lịch sử mua ứng dụng hiển thị mã hóa đơn, ngày mua, giá tiền và trạng thái quyền sử dụng hiện tại (Active / Revoked).
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Viết API kiểm tra quyền truy cập phục vụ SDK ứng dụng.
    2. Đồng bộ luồng hiển thị lịch sử mua hàng của khách hàng trên giao diện.

---

## 15. Quy trình hoàn tiền tích hợp (Refund Requests Pipeline)
*   **Mô tả**: Tiếp nhận yêu cầu hoàn tiền, tự động hoàn trả tiền giao dịch qua Stripe, đảo ngược connected transfers và khóa quyền chạy app.
*   **Điểm đánh giá thực tế**: **8.0 / 10** (đối soát tài chính hoàn tiền đầy đủ).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Cơ chế hoàn trả** | Hoàn trả PaymentIntent và tự động thu hồi Connected Transfer từ ví đối tác. | Hoàn trả qua Google Merchant Center, khấu trừ ví của nhà phát triển. | Do khách hàng yêu cầu qua Apple Support và Apple xử lý hoàn tiền. |
| **Vô hiệu hóa quyền** | Tự động chuyển trạng thái `isActive` của entitlement về `false` tức thì. | Thu hồi giấy phép tải ứng dụng. | Thu hồi quyền sử dụng app hoặc in-app purchases. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleRefundRequests`: `id`, `orderId`, `userId`, `amount`, `reason`, `status` ("pending", "approved", "rejected"), `stripeRefundId`.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Nhận yêu cầu hoàn tiền từ người dùng hoặc admin kích hoạt.
    2. Server gọi API Stripe tạo hoàn tiền: `refunds.create` với tham số `reverse_transfer = true` để lấy lại tiền tương ứng từ ví của nhà phát triển.
    3. Chuyển trạng thái đơn hàng sang `refunded` và gán `isActive = false` cho `BundleUserEntitlements` trong một transaction DB để bảo đảm tính toàn vẹn.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/admin/finance`
    *   **UI Controls**: Bảng duyệt các yêu cầu hoàn tiền dành cho Admin. Hiển thị thông tin đơn hàng, số tiền hoàn, lý do khách hàng và nút bấm phê duyệt duyệt hoàn tiền.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Tích hợp server action xử lý hoàn tiền của Stripe và cập nhật database.
    2. Đồng bộ luồng cập nhật giao diện hiển thị trạng thái đã hoàn tiền cho khách hàng.

---

## 16. Bản ghi vi phạm chính sách (Developer Strikes)
*   **Mô tả**: Ghi nhận các hành vi vi phạm chính sách của nhà phát triển và tự động khóa bundle nếu đạt giới hạn.
*   **Điểm đánh giá thực tế**: **8.0 / 10** (cơ chế tự động khóa bundle hoạt động tin cậy).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Ngưỡng khóa app** | Đình chỉ toàn bộ bundle của nhà phát triển nếu tích lũy đủ 3 strike active. | Khóa tài khoản vĩnh viễn sau 3 strike cảnh cáo vi phạm chính sách. | Khóa tài khoản vĩnh viễn nếu vi phạm chính sách nghiêm trọng. |
| **Quy trình gỡ bỏ** | Admin phê duyệt gỡ bỏ strike sẽ khôi phục lại trạng thái hoạt động. | Gửi khiếu nại để Google xem xét gỡ bỏ cảnh cáo. | Gửi đơn phúc khảo lên App Store Review Board. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleDeveloperStrikes`: `id`, `developerId`, `bundleId`, `strikeType`, `severity`, `description`, `isActive`, `revokedAt`, `createdAt`.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Khi admin tạo strike mới thông qua server action `issueStrikeAction`.
    2. Server đếm tổng số strike đang active của nhà phát triển.
    3. Nếu tổng số strike $\ge 3$, server tự động cập nhật trạng thái hoạt động của toàn bộ bundle do nhà phát triển đó sở hữu sang `suspended`.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/admin/strikes`
    *   **UI Controls**: Giao diện tạo strike dành cho admin (chọn nhà phát triển, chọn loại vi phạm và lý do). Bảng hiển thị danh sách các strike đang hoạt động kèm nút thu hồi strike.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Đồng bộ hệ thống kiểm tra số lượng strike của nhà phát triển khi tải danh sách bundle hiển thị trên Store.
    2. Tự động gửi email cảnh cáo vi phạm chính sách cho nhà phát triển khi bị áp strike.

---

## 17. Tín hiệu Abuse tự động (Bundle Abuse Signals)
*   **Mô tả**: Tự động giám sát lượng báo cáo vi phạm từ người dùng để gắn cờ ứng dụng độc hại.
*   **Điểm đánh giá thực tế**: **8.0 / 10** (quét định kỳ và tự động chuyển trạng thái an toàn).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Nhận diện sớm** | Quét tự động mỗi giờ, gắn cờ nếu có $\ge 6$ báo cáo/24 giờ. | Quét mã độc thông minh và giám sát lượng báo cáo vi phạm. | Giám sát báo cáo vi phạm qua cổng "Report a Problem". |
| **Xử lý tự động** | Tự động chuyển bundle sang trạng thái `under_review` để thẩm định. | Khóa ứng dụng tạm thời hoặc ẩn khỏi kết quả tìm kiếm. | Liên hệ nhà phát triển yêu cầu giải trình trong vòng 24-48 giờ. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleAbuseSignals`: `id`, `bundleId`, `anomalyScore`, `overallRiskScore`, `riskLevel` ("low", "medium", "high"), `flaggedForReview`.
    *   `BundleUserReports`: Lưu trữ chi tiết thông tin các báo cáo của người dùng.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Cron job `/api/cron/bundle-abuse` chạy hàng giờ đếm lượng báo cáo độc lập (theo thiết bị băm SHA-256) trong 24 giờ qua.
    2. Nếu số lượng thiết bị báo cáo $\ge 6$: Tạo/cập nhật bản ghi trong `BundleAbuseSignals`, thiết lập `flaggedForReview = true`, chuyển trạng thái bundle sang `under_review` để tạm dừng hiển thị công khai.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/admin/strikes` (khối Abuse Signals).
    *   **UI Controls**: Bảng danh sách các ứng dụng bị hệ thống gắn cờ cảnh báo lạm dụng kèm số lượng thiết bị báo cáo tương ứng và nút chuyển nhanh tới màn hình duyệt kiểm duyệt.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Đã hoàn thiện logic quét abuse định kỳ tại cron `bundle-abuse`.
    2. Xây dựng giao diện hiển thị danh sách cảnh báo abuse trên màn hình quản lý admin.

---

## 18. Chấm điểm & Nhận xét (Reviews & Ratings Stats)
*   **Mô tả**: Thu thập phản hồi chấm điểm sao của người dùng để tính toán điểm trung bình ứng dụng.
*   **Điểm đánh giá thực tế**: **8.0 / 10** (đồng bộ chỉ số thống kê tức thời).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Phân phối sao** | Thống kê sao thành phần (1-5 sao) lưu trữ trong bảng `BundleStats`. | Hiển thị biểu đồ phân bổ sao và phân tích nội dung đánh giá. | Hiển thị biểu đồ phân bổ sao. |
| **Phản hồi nhận xét** | Cho phép nhà phát triển viết phản hồi câu hỏi của người dùng. | Trả lời đánh giá trực tiếp trên cổng điều hành. | Trả lời đánh giá trực tiếp trên cổng điều hành. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleReviews`: `id`, `bundleId`, `userId`, `rating` (1-5), `reviewText`, `replyText`, `repliedAt`, `repliedById`.
    *   `BundleStats`: `bundleId`, `rating`, `ratingCount`, `rating1`, `rating2`, `rating3`, `rating4`, `rating5`, `downloadCount`, `activeInstalls`.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Người dùng gửi đánh giá: Server chèn dữ liệu nhận xét vào `BundleReviews`.
    2. Truy vấn đếm lại số lượng sao thành phần của bundle đó và tính sao trung bình mới.
    3. Cập nhật các chỉ số mới này vào bảng `BundleStats` để đồng bộ hiển thị trên cửa hàng.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: Tab Reviews trên giao diện store listing của dự án.
    *   **UI Controls**: Bảng danh sách nhận xét hiển thị số sao, nội dung và thời gian. Có ô nhập phản hồi kèm nút gửi dành cho nhà phát triển.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Viết server action lưu phản hồi đánh giá của nhà phát triển.
    2. Tích hợp tính năng lọc bình luận rác hoặc trùng lặp thiết bị spam.

---

## 19. Bản dịch thông tin cửa hàng (Store Localizations)
*   **Mô tả**: Quản lý nội dung mô tả, tiêu đề và ghi chú phát hành của ứng dụng đa ngôn ngữ.
*   **Điểm đánh giá thực tế**: **7.5 / 10**.

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Phương thức dịch** | Nhà phát triển tự chuẩn bị bản dịch cho từng ngôn ngữ đăng ký. | Hỗ trợ nút dịch tự động nhanh qua Google Translate. | Nhà phát triển phải tự chuẩn bị bản dịch cho từng ngôn ngữ. |
| **Hiển thị** | Tự động chọn ngôn ngữ hiển thị theo cấu hình thiết bị client. | Tự động hiển thị trang giới thiệu phù hợp vị trí người dùng. | Tự động hiển thị trang giới thiệu phù hợp vị trí người dùng. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleLanguages`: Quản lý các ngôn ngữ được hỗ trợ của bundle.
    *   `BundleLocalizations`: Lưu trữ chi tiết bản dịch (`id`, `bundleId`, `languageCode` [vi, en], `title`, `shortDescription`, `longDescription`, `releaseNotes`).
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Khi gọi API thông tin app, đọc thông số ngôn ngữ thiết bị của client.
    2. Tìm kiếm bản ghi tương ứng trong `BundleLocalizations`.
    3. Nếu không tìm thấy ngôn ngữ trùng khớp, tự động trả về bản dịch mặc định của bundle.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/lepoship/[projectId]/store-listing`
    *   **UI Controls**: Giao diện chỉnh sửa store listing dạng Tab: Mỗi tab đại diện cho một ngôn ngữ đã đăng ký để điền thông tin mô tả độc lập.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Thiết kế UI tab mô tả đa ngôn ngữ trực quan.
    2. Đồng bộ API store chi tiết truy xuất thông tin dịch theo vị trí địa lý người dùng.

---

## 20. Tiêu điểm nổi bật & Phân vùng (Featured Slots & Regions)
*   **Mô tả**: Thiết lập vị trí hiển thị các banner nổi bật trên trang chủ cửa hàng theo phân vùng địa lý.
*   **Điểm đánh giá thực tế**: **7.5 / 10** (đã hoàn thiện kiểm tra trùng lặp lịch biểu hiển thị).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Cấu hình vị trí** | Admin cấu hình trực tiếp thứ tự sắp xếp và thời gian chạy. | Hoàn toàn do thuật toán gợi ý của Google Play điều phối. | Do ban biên tập App Store đánh giá và chọn lựa thủ công. |
| **Chặn trùng lịch** | Tự động báo lỗi nếu có banner khác chạy cùng vị trí và thời gian. | Không áp dụng (chạy theo thuật toán thông minh cá nhân hóa). | Không áp dụng. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleFeaturedSlots`: `id`, `bundleId`, `slotType` ("carousel", "spotlight"), `title`, `subtitle`, `bannerUrl`, `region`, `sortOrder`, `startsAt`, `endsAt`, `isActive`.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Khi truy xuất trang chủ, đọc phân vùng của client (ví dụ `VN`).
    2. Lọc các bản ghi hoạt động trong `BundleFeaturedSlots` có `isActive = true` và thời gian hiện tại nằm trong khoảng hiển thị.
    3. Trả về mảng banner sắp xếp theo thứ tự `sortOrder` tăng dần.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/admin/featured`
    *   **UI Controls**: Trang quản lý banner của admin: nhập tiêu đề, tải ảnh banner, chọn phân vùng hiển thị, chọn ngày bắt đầu/kết thúc và kéo thả sắp xếp thứ tự hiển thị.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Thiết kế UI tạo banner nổi bật tích hợp kiểm tra overlap lịch chạy.
    2. Cập nhật API Store Home để phân phối banner nổi bật theo vùng thiết bị.

---

## 21. Hệ thống Outbound Webhooks (Webhooks Deliveries)
*   **Mô tả**: Tự động gọi HTTP POST thông báo sự kiện (như build hoàn thành, đơn hàng mới) đến máy chủ của nhà phát triển với độ tin cậy cao.
*   **Điểm đánh giá thực tế**: **8.5 / 10** (luồng hoạt động rất đáng tin cậy).

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Xác thực gửi tin** | Ký số HMAC-SHA256 gửi qua header `X-LepoShip-Signature`. | Gửi tin nhắn qua Google Cloud Pub/Sub. | Gửi thông báo ký số JWT qua HTTP POST. |
| **Khả năng tự hồi phục** | Tự động tắt webhook nếu lỗi liên tiếp 5 lần để tránh spam hệ thống. | Tự động gửi lại theo cấu hình hàng đợi của Google Pub/Sub. | Tự động gửi lại thông báo nếu máy chủ nhà phát triển trả về lỗi. |
| **Nhật ký gửi tin** | Lưu trữ lịch sử kết quả, mã phản hồi HTTP và thông tin lỗi chi tiết. | Theo dõi qua công cụ giám sát Pub/Sub trên Google Cloud. | Hỗ trợ kiểm tra lịch sử thông báo qua API của App Store Connect. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleWebhooks`: `id`, `bundleId`, `url`, `secret`, `events`, `isActive`, `failureCount`, `consecutiveFailures`.
    *   `BundleWebhookDeliveries`: `id`, `webhookId`, `eventKey`, `eventType`, `payload`, `status` [pending, delivered, failed], `attempt`, `nextRetryAt`.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Khi phát sinh sự kiện (Ví dụ: build completed): Lưu log delivery trạng thái pending.
    2. Tính chữ ký HMAC-SHA256 của payload sử dụng secret của webhook, gửi request HTTP POST tới URL đăng ký với timeout 5 giây.
    3. Nếu thất bại, tính toán thời gian chạy lại tiếp theo (sau 1m, 5m, 30m, 2h, 12h). Nếu lỗi liên tiếp đạt 5 lần, chuyển `isActive = false` của webhook đó.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/lepoship/[projectId]/settings/webhooks`
    *   **UI Controls**: Trang thêm cấu hình Webhook (nhập URL, chọn sự kiện nhận tin). Bảng hiển thị lịch sử gửi tin gồm cột: Event Type, URL, Status Code, Thời gian gửi và nút "Xem chi tiết payload".
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Viết cron job chạy mỗi 5 phút quét và gửi lại các webhook bị lỗi.
    2. Thiết kế bảng hiển thị lịch sử gửi webhook trên giao diện cài đặt dự án.

---

## 22. Cấu hình Runtime từ xa (Runtime Configurations)
*   **Mô tả**: Quản lý các biến môi trường và cờ cấu hình hoạt động động cho WebView khi ứng dụng khởi chạy mà không cần phát hành lại mã nguồn.
*   **Điểm đánh giá thực tế**: **7.0 / 10**.

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Kiểu phân phối** | Payload JSON trả về trực tiếp trong luồng check OTA của SDK. | Tích hợp thư viện Firebase Remote Config vào mã nguồn app Android. | Phải tự xây dựng server cấu hình riêng của nhà phát triển. |
| **Khóa cấu hình** | Có cờ `isLocked` bảo vệ cấu hình khỏi việc vô tình sửa đè. | Quản lý thay đổi cấu hình qua hệ thống phân quyền của Firebase. | Không áp dụng. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleRuntimeConfigEntries`: Quản lý các cấu hình dạng cặp key-value lưu trữ cho từng bundle.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Khi client khởi động, gọi API lấy cấu hình runtime.
    2. Server truy xuất toàn bộ các cặp key-value đang hoạt động của bundle.
    3. Trả về đối tượng JSON để client áp dụng (ví dụ: thay đổi URL máy chủ chat, bật/tắt tính năng bảo trì).
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/lepoship/[projectId]/runtime-config`
    *   **UI Controls**: Bảng quản lý key-value cho phép nhà phát triển thêm dòng mới, sửa key, sửa value, lưu cấu hình và cờ khóa ghi đè (Lock).
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Thiết kế UI trang quản lý cấu hình key-value động.
    2. Tích hợp cấu hình này vào payload trả về của API check update.

---

## 23. Từ khóa tìm kiếm & Thẻ SEO (Search Keywords & Tags)
*   **Mô tả**: Quản lý từ khóa tìm kiếm và thẻ danh mục của ứng dụng để phục vụ SEO/ASO cửa hàng.
*   **Điểm đánh giá thực tế**: **7.0 / 10**.

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Quản lý từ khóa** | Thêm trực tiếp các từ khóa vào DB và cập nhật chỉ số tìm kiếm. | Tự động tối ưu hóa SEO dựa trên mô tả ứng dụng và tag. | Trường Keywords giới hạn trong 100 ký tự phân cách bằng dấu phẩy. |
| **Danh mục phân loại** | Gán các thẻ danh mục (`BundleTags`) để phân nhóm bộ lọc. | Chọn các danh mục cố định (Game, Finance, Productivity,...). | Chọn danh mục chính (Primary) và danh mục phụ (Secondary). |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundleSearchKeywords`: Lưu trữ từ khóa ẩn của bundle và đếm số lượt tìm kiếm.
    *   `BundleTags`: Lưu thẻ phân loại bundle.
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Khi tìm kiếm ứng dụng trên Store: SQL so khớp chuỗi tìm kiếm trong tên app, mô tả, thẻ danh mục và từ khóa ẩn.
    2. Nếu tìm ra kết quả thành công từ từ khóa, tăng chỉ số `searchCount` của từ khóa đó để theo dõi hiệu suất SEO.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/lepoship/[projectId]/store-listing`
    *   **UI Controls**: Khung nhập từ khóa dạng thẻ (Tag input chip): Gõ từ khóa và bấm Enter để tự tạo thẻ từ khóa. Hiển thị số lượt tìm kiếm bên dưới mỗi từ khóa.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Tích hợp khung nhập từ khóa dạng thẻ vào màn hình cấu hình store listing.
    2. Tối ưu câu lệnh SQL tìm kiếm của store để đạt hiệu năng phản hồi nhanh.

---

## 24. Bản khai bảo mật thông tin (Privacy Declarations)
*   **Mô tả**: Bản khai báo công khai của nhà phát triển về loại dữ liệu thu thập (Vị trí, Danh bạ, Thiết bị) nhằm tăng tính minh bạch của app.
*   **Điểm đánh giá thực tế**: **7.0 / 10**.

### Bảng đối chiếu trực quan
| Tiêu chí so sánh | LepoShip (Thực tế Codebase) | Google Play Console | Apple App Store Connect |
| :--- | :--- | :--- | :--- |
| **Khai báo bảo mật** | Hiển thị danh mục các loại dữ liệu thu thập trực quan trên store. | Mục an toàn dữ liệu (Data Safety) bắt buộc hoàn thành. | Nutrition Labels mô tả chi tiết quyền và mục đích thu thập. |
| **Độ tin cậy** | Dựa trên bản khảo sát tự khai của nhà phát triển dự án. | Google quét mã nguồn để đối chiếu tính thực tế. | Apple quét mã nguồn để đối chiếu tính thực tế. |

*   **Mô hình Cơ sở dữ liệu (Database Models)**:
    *   `BundlePrivacyDeclarations`: Lưu trữ thông tin khai báo (`id`, `bundleId`, `dataType` [location, contacts, device_id], `purpose` [analytics, functionality], `isLinkedToUser`, `isUsedForTracking`).
*   **Luồng xử lý Backend (Backend Workflow & Logic)**:
    1. Ghi nhận thông tin khảo sát an toàn dữ liệu của nhà phát triển.
    2. API store lấy chi tiết app sẽ đính kèm bản khai bảo mật để store hiển thị nhãn an toàn trực quan giống nhãn dinh dưỡng của Apple.
*   **Yêu cầu giao diện (UI/UX Requirements)**:
    *   **Vị trí**: `/lepoship/[projectId]/store-listing`
    *   **UI Controls**: Giao diện bảng câu hỏi trắc nghiệm an toàn dữ liệu (Privacy Wizard). Khối "App Privacy" dạng lưới hiển thị minh bạch các quyền dữ liệu thu thập trên trang store chi tiết ứng dụng.
*   **Lộ trình phát triển chi tiết (Detailed Implementation Steps)**:
    1. Tạo giao diện bảng khảo sát trắc nghiệm quyền riêng tư trong màn hình store listing của dự án.
    2. Thiết kế khối hiển thị nhãn an toàn dữ liệu trực quan trên store.
