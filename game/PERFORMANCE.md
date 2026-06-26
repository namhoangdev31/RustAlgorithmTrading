# PERFORMANCE.md — Tối Ưu Hóa Bộ Nhớ WebGL & Vật Lý Havok

Tài liệu này đặc tả các tiêu chuẩn kỹ thuật tối ưu hóa tài nguyên phần cứng, quản lý bộ nhớ WebGL và xử lý vật lý Havok nhằm duy trì tốc độ 60 FPS ổn định trên thiết bị di động tầm trung.

---

## 🏎️ 1. Quy Tắc Bộ Nhớ & Tái Sử Dụng Đối Tượng (Memory Management)

1.  **Không tạo đối tượng trong Render Loop:** Cấm gọi `new Vector3()`, `new Color3()`, `new Matrix()` trong vòng lặp Render hoặc các sự kiện onBeforeRender. Việc khởi tạo đối tượng liên tục sẽ làm bộ dọn rác (Garbage Collector) của trình duyệt hoạt động dày đặc gây nghẽn luồng chính.
    *   *Giải pháp:* Sử dụng các đối tượng tạm (temp/cached) được khai báo tĩnh bên ngoài class hoặc ngoài vòng lặp.
2.  **Cấm tìm kiếm mesh theo tên mỗi khung hình:**
    *   **Cấm:** Gọi `scene.getMeshByName("hobin")` hoặc `scene.getTransformNodeByName("camera_target")` trong các hàm Update/Render Loop.
    *   *Giải pháp:* Tìm kiếm một lần duy nhất lúc khởi chạy màn chơi (lớp nạp cảnh) và lưu trữ tham chiếu (Cache) vào biến thành viên của class để sử dụng lại.

---

## 🔧 2. Quy Tắc Giải Phóng Tài Nguyên (Observable & Disposal)

1.  **Thu hồi Observable:**
    *   Mọi sự kiện đăng ký lắng nghe sự kiện của BabylonJS (ví dụ: `scene.onBeforeRenderObservable.add(...)`) bắt buộc phải được lưu lại đối tượng Observer và gọi `scene.onBeforeRenderObservable.remove(observer)` khi hủy hệ thống (dispose).
2.  **Giải phóng Material & Texture:**
    *   Khi hủy một Mesh động, phải giải phóng triệt để vật liệu và vân bề mặt đi kèm để tránh rò rỉ VRAM của card đồ họa:
        ```typescript
        mesh.dispose(false, true); // Giải phóng hình học và vật liệu liên kết
        ```

---

## 🥊 3. Quy Tắc Vật Lý Havok V2

1.  **Đọc vị trí từ Physics Body:**
    *   **Cấm:** Đọc tọa độ từ `Mesh.position` để làm logic gameplay. Vì vật lý Havok tính toán tọa độ độc lập trong môi trường WASM.
    *   *Giải pháp:* Luôn truy vấn tọa độ vị trí chuẩn xác từ **Physics Body** thông qua phương thức `.getLinearVelocity()` hoặc `.transformNode` của Physics Aggregate.
2.  **Cấu hình đơn vị vật lý:**
    *   Tỷ lệ chuẩn: 1 đơn vị trong game = 1 mét ngoài đời thực. Không đặt tỉ lệ mesh quá nhỏ hoặc quá lớn khiến các phép tính trọng lực, gia tốc của Havok bị sai lệch.

---

## 📦 4. Tải Tài Nguyên Nén Nâng Cao

1.  **Draco Compression:** Mọi mô hình glTF/glb phải được nén qua Draco. Thư mục `public/libs/` phải chứa sẵn bộ giải nén Draco WASM để giải mã đa luồng trên CPU.
2.  **KTX2 Textures:** Bề mặt chất liệu phải được chuyển đổi sang định dạng Basis Universal (.ktx2) để tải trực tiếp lên VRAM của GPU mà không qua bước giải nén của CPU, giúp giảm 60% mức tiêu thụ bộ nhớ RAM hệ thống.
3.  **LOD (Level of Detail):** Tự động hoán đổi đa giác của các vật thể môi trường đường phố dựa trên khoảng cách camera để giảm số lượng vẽ đỉnh (vertices count) mỗi khung hình.
