# 🤖 AGENTS.md — Quy Tắc Lập Trình Game "How to Fight"

> **MỤC TIÊU TỐI THƯỢNG:** Đảm bảo dự án phát triển lâu dài (1-2 năm) ổn định, có tính module cao, không bị rò rỉ bộ nhớ WebGL và sẵn sàng tích hợp Multiplayer MMO.
> 
> **QUY TẮC PHÂN QUYẾT:** Nếu có sự xung đột giữa tài liệu này và các tài liệu kiến trúc chuyên biệt (`ARCHITECTURE.md`, `GAMEPLAY.md`...), **Tài liệu kiến trúc chuyên biệt luôn thắng thế**.

---

## 🏛️ 1. Quy Tắc Kiến Trúc & Phân Lớp (Architecture Rules)

1.  **Phân lớp hệ thống độc lập:**
    *   `Presentation Layer (React UI)` ➔ `Babylon Engine Layer` ➔ `Gameplay Framework (ECS)` ➔ `Network Layer` ➔ `Persistence Layer`.
    *   **Cấm:** AI Agent tuyệt đối không nhét logic gameplay vào React Component. Gameplay chỉ tồn tại trong Gameplay Layer. Babylon chỉ chịu trách nhiệm render mesh và camera. React chỉ hiển thị UI 2D.
2.  **Quy tắc chiều phụ thuộc (Dependency Rule):**
    *   Cho phép: `React` ➔ `UI Layer` ➔ `Gameplay` ➔ `Engine`.
    *   **CẤM nhập ngược (Circular/Reverse Import):** Không được import bất kỳ logic Gameplay hay Engine nào ngược lại React (`Gameplay` ➔ `React` là cấm).
3.  **Tách biệt React & Babylon Scene:**
    *   React Component không được phép import trực tiếp `Babylon Scene` hay sục sạo mesh (`scene.meshes[0]`).
    *   React chỉ được giao tiếp thông qua **GameClient API Wrapper** (ví dụ: `GameClient.getPlayer()`).

---

## ⚙️ 2. Quy Tắc Gameplay & Loop (Gameplay Rules)

4.  **Chu trình chạy Game Loop:**
    *   Bắt buộc theo thứ tự: `Update()` ➔ `Gameplay` ➔ `Physics` ➔ `Animation` ➔ `Render`.
    *   Không được phép đảo ngược thứ tự (ví dụ: chạy Render trước rồi mới cập nhật Gameplay).
5.  **Cấm giao tiếp trực tiếp (Decoupled Systems):**
    *   **Cấm:** `Combat` ➔ `Inventory.addItem()`.
    *   **Đúng:** `Combat` ➔ Bắn sự kiện lên `Event Bus` ➔ `Inventory System` đăng ký sự kiện và tự xử lý.
6.  **Tách biệt logic khỏi Mesh (ECS Rule):**
    *   Không viết logic gameplay bên trong Mesh của BabylonJS. Mesh chỉ dùng để vẽ.
    *   Gameplay phải nằm hoàn toàn trong **ECS (Entity Component System)** thông qua các thành phần dữ liệu câm (`HealthComponent`, `MovementComponent`, `CombatComponent`) và các Systems xử lý logic.
7.  **Gameplay không phụ thuộc trực tiếp BabylonJS:**
    *   Cấu trúc đúng: `Player` ➔ `Transform` ➔ `Renderer` ➔ `Babylon` (để dễ dàng thay thế hoặc chạy headless test).
8.  **Không đọc trực tiếp thuộc tính hiển thị làm logic:**
    *   Cấm đọc `Mesh.position` để xử lý logic gameplay. Phải đọc vị trí từ **Physics Body** của Havok.
9.  **Hoạt ảnh (Animation) không quyết định Gameplay:**
    *   *Sai:* Chờ animation đấm kết thúc rồi mới tính sát thương (gây trễ và khó đồng bộ mạng).
    *   *Đúng:* Gameplay quyết định trạng thái ➔ Bắn sự kiện `AttackWindow` ➔ Kích hoạt hoạt ảnh hiển thị tương ứng.

---

## 🌐 3. Quy Tắc Đồng Bộ Mạng & Băng Thông (Networking Rules)

10. **Server-Authoritative (Server quyết định):**
    *   Client không bao giờ tự quyết định lượng sát thương (damage), tiền vàng (gold), vật phẩm (inventory) hay vị trí cuối cùng (final position).
    *   Client chỉ gửi phím bấm/input của người chơi, Server Rust xử lý và phản hồi kết quả chuẩn.
11. **Ràng buộc tài nguyên (Asset Loading):**
    *   Không được phép load file GLB/glTF trực tiếp trong mã nguồn gameplay. Mọi tài nguyên phải được nạp thông qua lớp quản lý **AssetManager**.

---

## 🏎️ 4. Quy Tắc Bộ Nhớ & Hiệu Năng WebGL (Performance Rules)

12. **Không tạo Vector/Color mới trong Render Loop:**
    *   Khai báo và tái sử dụng (Recycle) các biến vector tạm ngoài vòng lặp. Sử dụng các phương thức `ToRef` hoặc `InPlace`.
13. **Không tìm kiếm mesh bằng tên trong mỗi frame:**
    *   Cấm gọi `scene.getMeshByName()` hoặc `scene.getTransformNodeByName()` trong các hàm update/render loop. Hãy tìm kiếm 1 lần và cache lại.
14. **Thu hồi Observable:**
    *   Mọi Observable đăng ký với BabylonJS (`scene.onBeforeRenderObservable.add(...)`) bắt buộc phải gọi hàm gỡ đăng ký khi thực hiện hủy (dispose).
15. **Hủy tài nguyên chủ động:**
    *   Gọi `.dispose(false, true)` trên các Mesh, Material, Texture động khi không còn sử dụng để giải phóng VRAM.

---

## 📝 5. Quy Tắc Chuẩn Code & AI Agent (Coding Standards)

16. **Giới hạn kích thước tệp và lớp (Code Style):**
    *   Một Class tối đa: **300 ~ 500 dòng**.
    *   Một file tối đa: **500 dòng**.
    *   Một hàm (Method) tối đa: **<50 dòng**.
17. **Hạn chế Singleton:**
    *   Chỉ cho phép sử dụng Singleton cho: `AssetManager`, `AudioManager`, `GameClock`, `Config`. Tất cả các lớp khác phải được quản lý vòng đời rõ ràng.
18. **Phân rã Logging:**
    *   Không dùng console.log vô tội vạ. Tách biệt log cụ thể: `Gameplay log`, `Network log`, `Physics log`, `Render log`.
19. **Kiểm thử độc lập (Headless Testing):**
    *   Gameplay Layer phải được thiết kế để viết unit test được mà không cần khởi chạy Babylon Engine 3D.
20. **Nguyên tắc can thiệp của AI (Claude/CC Rule):**
    *   AI Agent tuyệt đối **không tự ý tái cấu trúc (refactor) toàn bộ dự án** nếu yêu cầu chỉ dừng ở mức sửa đổi một subsystem cụ thể.

---

## 📂 Tham Chiếu Các Tài Liệu Kiến Trúc Chuyên Biệt
*   [ARCHITECTURE.md](file:///Users/hoangnam/Developer/RustAlgorithmTrading/game/ARCHITECTURE.md) ➔ Chi tiết phân lớp và luồng dữ liệu của hệ thống.
*   [FOLDER_STRUCTURE.md](file:///Users/hoangnam/Developer/RustAlgorithmTrading/game/FOLDER_STRUCTURE.md) ➔ Quy định chi tiết sơ đồ thư mục và phân quyền code.
*   [NETWORK.md](file:///Users/hoangnam/Developer/RustAlgorithmTrading/game/NETWORK.md) ➔ Cách thức thiết lập WebSockets/WebRTC đồng bộ MMO.
*   [GAMEPLAY.md](file:///Users/hoangnam/Developer/RustAlgorithmTrading/game/GAMEPLAY.md) ➔ Chi tiết về ECS Framework, combat và quest engine.
*   [RENDERING.md](file:///Users/hoangnam/Developer/RustAlgorithmTrading/game/RENDERING.md) ➔ Thiết lập camera, ánh sáng, post-process của Babylon.
*   [PERFORMANCE.md](file:///Users/hoangnam/Developer/RustAlgorithmTrading/game/PERFORMANCE.md) ➔ Quy tắc tối ưu hóa bộ nhớ WebGL và Havok.
*   [CONTRIBUTING.md](file:///Users/hoangnam/Developer/RustAlgorithmTrading/game/CONTRIBUTING.md) ➔ Quy chuẩn viết code và coding convention.
