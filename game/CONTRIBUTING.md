# CONTRIBUTING.md — Quy Chuẩn Viết Code & Coding Standard

Tài liệu này quy định các tiêu chuẩn viết code, thiết kế lớp, kiểm thử và cấu trúc file áp dụng cho toàn bộ lập trình viên và AI Agent khi đóng góp mã nguồn vào dự án.

---

## 📏 1. Giới Hạn Kích Thước Mã Nguồn (Code Size Limits)

Để tránh hiện tượng sinh file khổng lồ khó bảo trì, mọi đoạn code viết mới phải tuân thủ nghiêm ngặt giới hạn kích thước sau:
*   **Một Class tối đa:** **300 ~ 500 dòng code**. Nếu vượt quá, bắt buộc phải phân rã thành các class con hoặc chia nhỏ thành các Component/System trong ECS.
*   **Một tệp tin (.ts, .tsx) tối đa:** **500 dòng code**.
*   **Một hàm/phương thức (Method) tối đa:** **<50 dòng code**. Mỗi hàm chỉ thực hiện đúng một trách nhiệm duy nhất (Single Responsibility Principle).

---

## 🚫 2. Quy Tắc Hạn Chế Singleton Pattern

*   **Quy tắc:** Tuyệt đối không tự ý tạo các lớp Singleton (`static Instance`) vô tội vạ. Việc lạm dụng Singleton sẽ làm code bị ràng buộc chặt, cực kỳ khó viết Unit Test độc lập.
*   **Danh sách các lớp ĐƯỢC PHÉP làm Singleton:**
    1.  `AssetManager` (Quản lý và cache mô hình 3D, KTX2 textures).
    2.  `AudioManager` (Quản lý nạp và phát luồng âm thanh).
    3.  `GameClock` (Đồng hồ đếm giây chuẩn của game loop).
    4.  `Config` (Cấu hình tĩnh toàn cục).
*   **Các hệ thống khác:** Phải được khởi tạo thông qua Dependency Injection hoặc quản lý vòng đời rõ ràng bởi `GameClient` hoặc `ECS Engine`.

---

## 📜 3. Tiêu Chuẩn Định Kiểu & Đặt Tên (Coding Style)

1.  **Strict Type Checking:** Kích hoạt `strict: true` trong tsconfig. Cấm sử dụng kiểu `any` hoặc ép kiểu `as any` để trốn lỗi TypeScript.
2.  **Đặt tên biến & Hàm:**
    *   Sử dụng camelCase cho thuộc tính, tên biến và tên hàm.
    *   Sử dụng PascalCase cho tên Class, Interface, Enum.
    *   Sử dụng SNAKE_UPPERCASE cho các hằng số (`const MAX_HP = 100`).
3.  **Thuộc tính Private:** Các thuộc tính và phương thức private/protected trong Class bắt buộc phải có tiền tố dấu gạch dưới `_` (ví dụ: `private _currentHp: number`).

---

## 📝 4. Quy Tắc Ghi Nhật Ký (Logging Discipline)

Không sử dụng `console.log` bừa bãi. Phải ghi log phân tách rõ ràng theo từng phân vùng hệ thống để dễ dàng debug:
*   **Gameplay Logs:** Chỉ log các sự kiện chuyển đổi trạng thái combat, đòn đánh trúng, chết nhân vật.
*   **Network Logs:** Chỉ log sự kiện kết nối/mất kết nối, độ trễ Ping, lệch đồng bộ vị trí quá mức (Reconciliation).
*   **Physics Logs:** Chỉ log khi khởi tạo Havok thành công hoặc phát hiện va chạm hitbox không lệ.
*   **Render Logs:** Chỉ log khi nạp scene thành công hoặc lỗi tải shader.

---

## 🧪 5. Tiêu Chuẩn Kiểm Thử (Unit Testing Standard)

*   Toàn bộ mã nguồn xử lý logic gameplay (trong thư mục `src/ecs/systems/` và `src/gameplay/`) phải được viết Unit Test bằng Jest/Vitest.
*   Thiết kế hệ thống bắt buộc phải **chạy test được ở chế độ Headless** (không có GPU, không khởi động BabylonJS Engine). Mọi phụ thuộc đồ họa phải được Mock.
