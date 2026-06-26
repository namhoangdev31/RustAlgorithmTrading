# NETWORK.md — Đồng Bộ Mạng & Băng Thông MMO

Tài liệu này đặc tả cơ chế đồng bộ mạng thời gian thực phục vụ chế độ Multiplayer MMO thế giới mở 3D.

---

## 🔒 1. Nguyên Tắc Tối Thượng: Server-Authoritative

*   **Quy tắc số 1:** Game Client hoàn toàn **KHÔNG** có quyền tự quyết định các chỉ số quan trọng bao gồm: Sát thương gây ra (damage), lượng tiền nhận được (gold/coins), thay đổi vật phẩm trong túi đồ (inventory) và tọa độ vị trí cuối cùng của nhân vật.
*   **Hành động của Client:** Chỉ gửi đi các gói tin chứa hành động đầu vào (Input) của người chơi (ví dụ: *"Nhấn phím di chuyển tiến"*, *"Nhấn phím đấm"*).
*   **Hành động của Server:** Server nhận input, tính toán vị trí, kiểm tra va chạm, xác nhận sát thương và gửi lại trạng thái chuẩn xác cho Client hiển thị.

---

## ⚙️ 2. Hệ Thống Đồng Bộ Vị Trí (Movement Synchronization)

Để loại bỏ cảm giác lag trễ khi chơi mạng, Client áp dụng các kỹ thuật sau:

### 2.1 Dự Đoán Phía Client (Client-Side Prediction)
*   Khi người chơi ấn phím di chuyển, Client lập tức tính toán vật lý cục bộ và thay đổi vị trí nhân vật ngay lập tức mà không đợi phản hồi của Server.

### 2.2 Giải Quyết Sai Lệch (Reconciliation & Rollback)
*   Client lưu trữ một danh sách các Input kèm theo số hiệu Tick (Tick ID) chưa được Server xác nhận vào một hàng đợi đệm.
*   Khi nhận được gói tin Snapshot vị trí chuẩn từ Server tại Tick ID tương ứng:
    *   So sánh tọa độ dự đoán của Client với tọa độ thực tế của Server.
    *   Nếu khoảng cách sai biệt lớn hơn `0.15 mét`: Reset vị trí nhân vật về tọa độ chuẩn của Server, sau đó chạy lại (Replay) toàn bộ các input còn lại trong hàng đợi để cập nhật vị trí mới nhất (Rollback).

### 2.3 Nội Suy Người Chơi Khác (Entity Interpolation)
*   Các người chơi khác trên bản đồ (Remote Players) được di chuyển mượt mà thông qua kỹ thuật nội suy tuyến tính (Lerp) giữa hai điểm tọa độ chuẩn gần nhất nhận về từ Server, với độ trễ đệm cố định là 100ms.

---

## 📦 3. Định Dạng Gói Tin & Nén Dữ Liệu

1.  **Binary Serialization (Protobuf):** Mọi gói tin di chuyển và combat tần suất cao bắt buộc phải được mã hóa thành nhị phân thông qua thư viện Protocol Buffers trước khi truyền tải qua mạng để giảm kích thước gói tin xuống mức tối thiểu.
2.  **Delta Snapshots:** Server chỉ gửi các gói tin mô tả sự chênh lệch trạng thái (Delta) so với gói tin trước đó (ví dụ: chỉ gửi thông tin máu thay đổi, không gửi lại toàn bộ thông tin nhân vật).
3.  **Network Logging:** Tách biệt toàn bộ log kết nối mạng ra một tệp riêng (`network_debug.log`). Chỉ ghi log khi phát hiện mất gói tin (Packet Loss), mất kết nối hoặc lệch đồng bộ quá lớn (Reconciliation threshold breached).
