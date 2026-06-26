# RENDERING.md — Pipeline Đồ Họa & Đồng Bộ Vòng Lặp

Tài liệu này đặc tả quy trình vẽ 3D, thiết lập camera, ánh sáng, hậu kỳ trong Babylon.js và cơ chế chạy Game Loop đồng bộ.

---

## 🔄 1. Quy Tắc Vòng Lặp Game (Game Loop Sequence)

Mỗi khung hình chạy trong `engine.runRenderLoop` bắt buộc phải thực thi tuần tự theo đúng luồng sau:
1.  **Update Input / Network:** Nhận phím bấm từ người chơi hoặc gói tin từ máy chủ.
2.  **Gameplay Updates (ECS):** Cập nhật logic di chuyển, chiến đấu, AI, trạng thái.
3.  **Physics Simulation (Havok):** Chạy bước tính vật lý và giải quyết va chạm.
4.  **Animation Blending:** Chuyển đổi hoạt ảnh nhân vật dựa trên vận tốc và trạng thái combat.
5.  **Render:** Vẽ khung cảnh 3D lên WebGL Canvas.

*Quy tắc cứng:* **KHÔNG** được phép chạy Render trước khi cập nhật logic Gameplay.

---

## 🎥 2. Camera, Ánh Sáng & Đổ Bóng (Scene Setup)

1.  **Góc nhìn TPS:** Sử dụng `ArcRotateCamera` khóa mục tiêu nhìn vào một Node ảo (Target Node) đặt tại vị trí ngang tầm mắt nhân vật chính (`y = 1.6m`), giúp camera xoay mượt mà quanh nhân vật mà không bị giật.
2.  **Ánh sáng mặt trời:** Sử dụng `DirectionalLight` với góc chéo kết hợp `CascadedShadowMap` (CSM) 2048px để tạo bóng đổ sắc nét cho môi trường Open World đường phố.
3.  **Ánh sáng phản chiếu:** Tải tệp `.env` môi trường nén để tạo lớp phản chiếu ánh sáng tự nhiên (PBR Rendering) trên các bề mặt trang phục da, kim loại và mặt đường ướt mưa.

---

## 🌫️ 3. Hiệu Ứng Hậu Kỳ (Post-Processing Pipeline)

Sử dụng một `DefaultRenderingPipeline` duy nhất gắn vào camera chính:
*   **FXAA Enabled:** Khử răng cưa hiệu năng cao cho thiết bị di động.
*   **Bloom Enabled:** Tạo hiệu ứng ánh sáng lóa nhẹ khi nhân vật ra nắng hoặc thực hiện đòn đánh nộ chí mạng.
*   **ACES Tone Mapping:** Cân bằng dải sáng động HDR để màu sắc game sâu và chân thực hơn.

---

## 📺 4. Tách Biệt Canvas & React UI

1.  **Quy tắc React:** Các component React (HUD, Stream Overlay) **TUYỆT ĐỐI KHÔNG** được import trực tiếp đối tượng `Scene` của BabylonJS hoặc truy cập trực tiếp mesh trên cảnh (`scene.meshes[0]`).
2.  **Quy tắc gọi API:** React chỉ tương tác với game thông qua các API an toàn được định nghĩa trong class **GameClient** (ví dụ: `GameClient.getPlayerStats()`).
3.  **Floating Numbers:** Các con số sát thương bay lên khi đấm trúng đối thủ phải được vẽ trực tiếp trong không gian 3D của BabylonJS (sử dụng Babylon 3D GUI hoặc TransformNode gắn text mesh), không dùng React DOM overlays để tránh lệch tọa độ khi camera quay nhanh.
