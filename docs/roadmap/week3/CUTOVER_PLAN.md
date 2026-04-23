# Cutover Plan (Week 3 One-pass)

## Mục tiêu

Triển khai contract cutover trong một lần với kiểm soát rủi ro rõ ràng, rollback được ngay khi có tín hiệu lỗi.

## Dependency matrix

| Lane | Scope | Dependency | Merge condition |
|---|---|---|---|
| Lane 1 | Bridge parser + envelope handling (Signal path) | None | Parser matrix `CAPTURED_PASS` (positive + negative + mismatch) |
| Lane 2 | Models/types mapping (RiskDecision + ExecutionAck) | Lane 1 | Cross-runtime tests lane 2 pass |
| Lane 3 | Observability logging contract + trace chain | Lane 1 + Lane 2 | Observability tests + shadow log audit pass |

## Triage cluster mapping

| Cluster | Định nghĩa | Severity mặc định | Gate impact |
|---|---|---|---|
| A - Incompatibility | Rust/Python không parse được hoặc có crash | P0 | blocking |
| B - Semantic Drift | Parse được nhưng sai nghĩa dữ liệu nghiệp vụ | P1 | blocking nếu ảnh hưởng risk/execution |
| C - Observability Gap | Thiếu log/trace để triage root cause | P2 | blocking nếu che mờ P0/P1 |

## Cutover steps

1. Freeze contract + parser behavior + logging schema.
2. Snapshot baseline trước cutover.
3. Thực thi lane 1 -> lane 2 -> lane 3 theo dependency.
4. Chạy full command profile + compliance audits và capture evidence.
5. Gate rehearsal + decision.

## Rollback trigger/action per lane

| Lane | Trigger | Detection window | Rollback action | Success criteria |
|---|---|---|---|---|
| Lane 1 | Parse error spike hoặc parser panic-like symptom | 5 phút | `SCHEMA_STRICT_MODE=false`, restore snapshot bridge/parser | parser smoke pass, queue ổn định |
| Lane 2 | Semantic mismatch gây reject dây chuyền ở risk/execution | 5 phút | rollback mapping patch lane 2, giữ lane 1 ổn định | handoff pass lại với payload chuẩn |
| Lane 3 | Trace chain đứt hoặc log storm | 5 phút | rollback observability patch, giữ correlation context tối thiểu | log coverage trở lại ngưỡng chuẩn |

## Network disconnect rehearsal

- Kịch bản: ngắt kết nối ZMQ giữa lúc truyền message lớn.
- Kỳ vọng: reconnect thành công, pipeline không treo, log có `correlation_id` + trạng thái message loss/retry.
- Evidence: `EV-W3-214`.

## Rollback evidence

- Rollback rehearsal bắt buộc có `Evidence ID` riêng (chuẩn dùng: `EV-W3-221`).
- SLA rollback rehearsal: phục hồi về baseline trong dưới 5 phút.
- Không được set `GO` nếu chưa capture rollback drill pass.

## Performance baseline

- Capture latency luồng `serialize(Python) -> ZMQ -> deserialize(Rust)`.
- Capture thêm watermark E2E `SignalEvent -> ExecutionAck` để làm mốc cho các tuần sau.
- Ghi tối thiểu `avg_ms`, `p95_ms`, `max_ms` vào final report.

---
Last updated: W03 no-date mode sync
