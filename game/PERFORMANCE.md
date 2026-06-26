# PERFORMANCE.md — Tối Ưu Hóa Bộ Nhớ WebGL & Vật Lý Havok

Tài liệu này đặc tả các tiêu chuẩn kỹ thuật tối ưu hóa tài nguyên phần cứng, quản lý bộ nhớ WebGL/WebGPU và xử lý vật lý Havok nhằm duy trì tốc độ 60 FPS ổn định trên thiết bị di động tầm trung.

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

---

## ⚡ 5. Tối Ưu Hóa & Cấu Hình WebGPU (WebGPU Optimization)

Khi khởi chạy game trên trình duyệt hỗ trợ WebGPU, hệ thống phải ưu tiên WebGPU hơn WebGL2 để tận dụng tối đa băng thông đa luồng và Compute Shaders.

1.  **Khởi tạo Engine tương thích ngược (Fallback Engine):**
    *   Luôn kiểm tra khả năng hỗ trợ WebGPU bất đồng bộ trước khi tạo Engine:
        ```typescript
        import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
        
        async function createEngine(canvas: HTMLCanvasElement) {
            if (await WebGPUEngine.IsSupportedAsync) {
                const engine = new WebGPUEngine(canvas, {
                    deviceDescriptor: {
                        requiredFeatures: [
                            "texture-compression-astc", // Hỗ trợ nén texture chất lượng cao
                            "texture-compression-bc",
                            "texture-compression-etc2"
                        ]
                    },
                    antialiasing: true
                });
                await engine.initializeProvidersAsync();
                return engine;
            }
            // Fallback sang WebGL2
            return new Engine(canvas, true);
        }
        ```
2.  **Sử dụng Compute Shaders:**
    *   Đối với các hiệu ứng hạt số lượng cực lớn (như cát bay, mưa bụi bến cảng Chương 5) hoặc tính toán bầy đàn (Crowd simulation AI ở đường phố), bắt buộc sử dụng **Compute Shaders** (`ComputeShader` class của BabylonJS) để xử lý tính toán song song trực tiếp trên GPU thay vì nghẽn luồng CPU.
3.  **Tối ưu hóa GPU Buffer & Uniform Updates:**
    *   Hạn chế ghi lại (Write) dữ liệu vào GPU Buffers trong mỗi frame. Gom các giá trị tĩnh của chất liệu vào một Uniform Buffer chung và chỉ cập nhật khi thuộc tính thay đổi (như khi nhân vật đổi màu da hay trang phục).
4.  **Pre-warm Shaders (Tránh lag biên dịch Shader ban đầu):**
    *   WebGPU biên dịch shader lúc runtime rất chặt chẽ. AI phải cấu hình nạp trước các vật liệu (Shader warming) khi hiển thị màn hình loading screen, tránh hiện tượng đơ giật khung hình nhẹ (micro-stuttering) trong giây đầu tiên bước vào trận đấu.

