# ARCHITECTURE.md — Kiến Trúc Hệ Thống Lõi (System Architecture)

Tài liệu này đặc tả kiến trúc 5 lớp của dự án game "How to Fight". Mọi sửa đổi hệ thống phải tuân thủ luồng phân lớp này để tránh tạo ra spagetti code.

---

## 🗺️ 1. Mô Hình 5 Phân Lớp (5-Layer Architecture)

```
┌────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER (React)           │
│  - Giao diện HUD 2D, Stream Overlay, Chat Box          │
│  - Hoàn toàn KHÔNG chứa logic gameplay hay WebGL       │
└───────────────────────────┬────────────────────────────┘
                            │ Đọc trạng thái & Phát Input
                            ▼
┌────────────────────────────────────────────────────────┐
│                   BABYLON ENGINE LAYER (Renderer)      │
│  - Babylon.js Scene, Camera, Lighting, Shadows         │
│  - Chỉ thực hiện vẽ Mesh & phát hoạt ảnh hiển thị      │
└───────────────────────────┬────────────────────────────┘
                            │ Ticks & Transform Sync
                            ▼
┌────────────────────────────────────────────────────────┐
│                   GAMEPLAY FRAMEWORK (ECS)             │
│  - Khung logic cốt lõi độc lập với BabylonJS           │
│  - Chứa Entities, Components và Systems                │
└───────────────────────────┬────────────────────────────┘
                            │ Read/Write Binary packets
                            ▼
┌────────────────────────────────────────────────────────┐
│                   NETWORK LAYER (WebRTC/WS)            │
│  - Serialization (Protobuf), Interpolation             │
│  - Client-Side Prediction, Reconciliation              │
└───────────────────────────┬────────────────────────────┘
                            │ Offline Cache & API Requests
                            ▼
┌────────────────────────────────────────────────────────┐
│                   PERSISTENCE LAYER (Go API & Local)   │
│  - SaveManager, Offline Storage (LocalStorage)         │
└────────────────────────────────────────────────────────┘
```

---

## ⛓️ 2. Quy Tắc Luồng Phụ Thuộc (Dependency Rules)

1.  **Luồng một chiều:** Tầng trên được phép gọi xuống tầng dưới trực tiếp. Tầng dưới **tuyệt đối không** được import hoặc tham chiếu ngược lên tầng trên.
    *   *Hợp lệ:* React UI gọi phương thức của GameClient.
    *   *Không hợp lệ:* Gameplay logic import component React để thay đổi giao diện.
2.  **Kênh giao tiếp ngược (Event Bus):** Khi tầng dưới cần báo hiệu lên tầng trên (ví dụ: CombatSystem báo cáo máu người chơi thay đổi để React cập nhật thanh HP), bắt buộc phải phát đi một sự kiện lên **Event Bus** dùng chung. Tầng trên sẽ đăng ký lắng nghe sự kiện này và tự cập nhật giao diện của mình.

---

## 🔄 3. Luồng Xử Lý Sự Kiện Mẫu (Input to Render Cycle)

```
[Bàn phím/Touch] ➔ [InputManager] ➔ [InputComponent (ECS)]
                                          │
                                          ▼
                                   [MovementSystem] (Tính toán vị trí chuẩn dựa trên Physics Body)
                                          │
                                          ▼
                                   [TransformComponent] (Cập nhật tọa độ x,y,z mới)
                                          │
                                          ▼
                                   [Renderer (Babylon)] (Dịch chuyển Mesh 3D trên màn hình)
```
*   **Điểm mấu chốt:** BabylonJS chỉ đóng vai trò là một "Renderer" (bộ hiển thị). Nếu gỡ bỏ BabylonJS, logic di chuyển của người chơi vẫn chạy bình thường trong hệ thống ECS (phục vụ viết Unit Test không giao diện).
