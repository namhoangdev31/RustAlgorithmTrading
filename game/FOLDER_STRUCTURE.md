# FOLDER_STRUCTURE.md — Quy Định Cấu Trúc Thư Mục & Phân Quyền Code

Để giữ dự án sạch sẽ và ngăn chặn AI tự phát sinh file rác, cấu trúc thư mục trong `game/src/` được quy định cứng như sau.

---

## 📂 Sơ Đồ Cấu Trúc Thư Mục Chuẩn (`game/src/`)

```
src/
├── app/                       # Next.js Pages router (Chỉ chứa các file page/layout định tuyến)
├── ui/                        # Presentation Layer (Tất cả React components, HUD overlays)
│   ├── components/            # Các widget UI dùng chung
│   ├── overlays/              # StreamOverlay, DialogueBox, MainMenu
│   └── hooks/                 # React hooks kết nối với Event Bus
├── engine/                    # Babylon Engine Layer (Chỉ xử lý render và hiển thị mesh)
│   ├── core/                  # GameLoop, SceneManager
│   ├── render/                # Camera, Lighting, PostProcessing
│   └── scripts.ts             # BabylonJS Editor scripts dictionary
├── gameplay/                  # Logic Gameplay lõi ngoài ECS (Quest tracker, State machines)
├── ecs/                       # Gameplay Layer (Kiến trúc ECS chính)
│   ├── core/                  # Engine ECS (EntityManager, SystemManager)
│   ├── components/            # Thành phần dữ liệu câm (HealthComponent, InputComponent)
│   └── systems/               # Hệ thống thực thi (MovementSystem, DamageSystem, AnimationSystem)
├── network/                   # Network Layer (WebSocket & WebRTC sync)
│   ├── core/                  # Connection Manager
│   ├── packets/               # Protobuf serializer
│   └── sync/                  # Prediction, Interpolation
├── physics/                   # Lớp bọc vật lý Havok Physics V2
├── audio/                     # AudioManager (Tải và phát BGM, SFX)
├── assets/                    # AssetManager (Draco loader, KTX2, Cache)
├── config/                    # Cấu hình game (phím bấm, địa chỉ server, thông số game)
└── shared/                    # Kiểu dữ liệu TypeScript & Event Bus dùng chung
    ├── events/                # EventBus.ts (Kênh PubSub chính)
    └── types/                 # Định nghĩa Interface võ sĩ, kỹ năng
```

---

## 🔒 Quy Định Phân Quyền Code (Ownership Rules)

1.  **Thư mục `ui/`:** Chỉ chứa mã nguồn React (TSX). **CẤM** import bất kỳ tệp tin nào thuộc `engine/`, `ecs/systems/` hay `physics/`. Chỉ được phép import `GameClient` từ `engine/core/` và `EventBus` từ `shared/events/`.
2.  **Thư mục `ecs/components/`:** Chỉ chứa định nghĩa interface/class của dữ liệu câm. **CẤM** viết code logic, phép tính toán hay chứa hàm xử lý.
3.  **Thư mục `ecs/systems/`:** Chứa mã logic xử lý. Mỗi file chỉ chứa đúng một System thực hiện một nhiệm vụ duy nhất (ví dụ: `MovementSystem.ts` chỉ tính toán di chuyển).
4.  **Thư mục `engine/`:** Chỉ chứa mã nguồn tương tác trực tiếp với BabylonJS (mesh, camera, lights, materials). **CẤM** nhét logic chiến đấu, tính toán sát thương hay nhiệm vụ cốt truyện ở đây.
