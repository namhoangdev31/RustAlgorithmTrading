# GAMEPLAY.md — Khung Hướng ECS, Chiến Đấu & Cốt Truyện

Tài liệu này đặc tả cách thức triển khai logic Gameplay của game thông qua mô hình Entity Component System (ECS) tách biệt, Event Bus, và Story Engine hướng dữ liệu.

---

## 🥊 1. Quy Tắc ECS (Entity Component System)

*   **Không viết logic trong Mesh:** Cấm tuyệt đối việc nhét code logic chiến đấu, di chuyển, máu me hay va chạm bên trong Mesh của BabylonJS. Mesh chỉ dùng để render hình ảnh 3D.
*   **Thực thể câm (Entities):** Chỉ là một ID số hoặc UUID đại diện cho nhân vật, quái vật, vật phẩm.
*   **Thành phần dữ liệu (Components):** Chỉ chứa dữ liệu thô (ví dụ: `HealthComponent` chỉ chứa máu, `CombatComponent` chứa cooldown).
*   **Hệ thống thực thi (Systems):** Chạy liên tục trong game loop để quét qua các Entities có chứa tập hợp Components tương ứng để xử lý.

---

## 🛡️ 2. Phân Rã Hệ Thống Combat (Decoupled Combat Systems)

Đòn đánh, va chạm và sát thương không được xử lý trong một Class duy nhất mà được chia nhỏ thành 4 Systems độc lập:

```
[Movement/Input Systems] ➔ Cập nhật hướng di chuyển
         │
         ▼
[CombatSystem] ➔ Đăng ký đòn đánh, trừ thể lực (Stamina), quản lý cooldown
         │
         ▼
[AnimationSystem] ➔ Nhận diện trạng thái và blend hoạt ảnh
         │
         ▼
[HitSystem] ➔ Kích hoạt collider trên tay/chân và check va chạm vật lý (Havok)
         │
         ▼
[DamageSystem] ➔ Tính sát thương thực tế, trừ máu và cập nhật trạng thái
```

---

## 🚌 3. Giao Tiếp Qua Event Bus (PubSub)

Mọi hoạt động tương tác giữa các tính năng khác nhau bắt buộc phải thông qua Event Bus dùng chung để tránh tạo liên kết cứng (Tight Coupling).

*   *Sai:* `CombatSystem` gọi trực tiếp `QuestTracker.onKillEnemy()` và `AudioManager.playHitSound()`.
*   *Đúng:* 
    1.  `DamageSystem` bắn sự kiện `"EnemyKilled"` lên Event Bus.
    2.  `QuestTracker` tự đăng ký lắng nghe `"EnemyKilled"` để cập nhật số lượng nhiệm vụ.
    3.  `AudioManager` tự đăng ký lắng nghe `"EnemyKilled"` để phát âm thanh chiến thắng.

---

## 📖 4. Story Engine Hướng Dữ Liệu (Data-Driven Story)

*   Toàn bộ cấu trúc màn chơi (ải đấu, Boss), lời thoại nhân vật, cắt cảnh phải được đọc từ tệp tin cấu hình JSON tĩnh.
*   **DialogueManager:** Đọc lời thoại từ file JSON, bắn sự kiện `"DialogueTextUpdated"` để React UI hiển thị text, không tự vẽ UI.
*   **CutsceneManager:** Đọc camera path từ JSON, tạm khóa điều khiển của người chơi, di chuyển camera của BabylonJS dọc Bezier path, chạy hoạt ảnh của các diễn viên, và trả lại quyền điều khiển khi hoàn tất.

---

## 🧪 5. Kiểm Thử Độc Lập (Headless Unit Testing)

Tất cả các tệp tin thuộc `ecs/systems/` và `gameplay/` phải được thiết kế để có thể chạy thử nghiệm bằng Jest/Vitest trong môi trường NodeJS (headless) mà không cần khởi tạo canvas WebGL, Engine BabylonJS hay tải thư viện GPU. 
*   *Giải pháp:* Mock toàn bộ các cấu phần hiển thị (Renderer) thành các interface câm để thực thi kiểm thử nhanh chóng và chính xác.
