# Schema Migration Plan v1 (Week 3)

## Mục tiêu migration
Chuẩn hóa message contract từ `v0` (legacy permissive) sang `v1` (strict required fields) mà không làm gãy critical path Python-Rust.

## Migration lanes

- Lane 1: Signal contract.
- Lane 2: RiskDecision + ExecutionAck.
- Lane 3: Observability tracing/event envelope.

## Lane dependency matrix

| Lane | Phụ thuộc | Rule merge |
|---|---|---|
| Lane 1 (Signal) | Không | Merge khi đạt `CAPTURED_PASS` 100% test-set lane 1 |
| Lane 2 (Risk/Ack) | Lane 1 | Chỉ merge khi lane 1 đã `CAPTURED_PASS` 100% |
| Lane 3 (Observability) | Lane 1 + Lane 2 | Chỉ merge khi lane 1 và lane 2 qua phase gate |

## Rollback strategy (bắt buộc)

| Lane | Rollback trigger | Rollback action |
|---|---|---|
| Lane 1 | Parse mismatch lặp liên tục trong 5 phút | Set `SCHEMA_STRICT_MODE=false`, quay về compatibility path v0 |
| Lane 2 | Risk/Ack contract error vượt ngưỡng cho phép trong 5 phút | Set `SCHEMA_STRICT_MODE=false`, giữ lane ở `BLOCKED` |
| Lane 3 | Observability event reject rate tăng đột biến trong 5 phút | Set `SCHEMA_STRICT_MODE=false`, giữ trace theo alias compatibility |

## Migration phases

### Phase A - Contract freeze
- Freeze v1 envelope: `schema_version`, `trace_id`, `event_type`, `timestamp`, `payload`.
- Freeze standards cho `Signal`, `RiskDecision`, `ExecutionAck`, `ObservabilityEvent`.

### Phase B - Compatibility bridge
- Cho phép parse `v0` trong giai đoạn chuyển tiếp.
- Với payload `v0`: warning + map issue + compatibility adapter.

### Phase C - Validation & rollout
- Chạy positive/negative/version mismatch tests theo baseline profile.
- Không vượt phase nếu chưa qua dependency gate.

## Mapping rules

| Contract | Legacy shape (`v0`) | Target shape (`v1`) | Compatibility note |
|---|---|---|---|
| Envelope | thiếu metadata bắt buộc | đủ 5 field envelope | `v0` parse cảnh báo trong transition window |
| Signal | `direction`, `strength`, timestamp int | `action`, `confidence`, timestamp ISO | normalize tại bridge layer |
| RiskDecision | `approved`, `reason` | `decision`, `reason_code`, `limit_snapshot` | bổ sung context để replay/audit |
| ExecutionAck | thiếu telemetry fields | `order_id`, `route`, `latency_bucket`, `retry_count` | default mapping chỉ dùng cho fallback transition |
| ObservabilityEvent | `correlation_id` + timestamp drift | `trace_id`, `component`, `severity`, `timestamp`, `payload` | alias chỉ tạm thời trong transition |

## Exit conditions
- Toàn bộ scenario bắt buộc có evidence capture.
- Không còn P0 ở `NEW/IN_PROGRESS/BLOCKED`.
- `W3-ISS-009` ở `DONE` với evidence.
- Gate status nhất quán giữa baseline/gate/final report.

---
Last updated: 2026-04-23
