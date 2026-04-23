# Schema Migration Plan v1 (Week 3)

## Mục tiêu migration
Chuẩn hóa message contract từ `v0` (legacy permissive) sang `v1` (strict required fields) mà không làm gãy critical path Python-Rust.

## Migration phases

### Phase A - Contract freeze
- Freeze v1 envelope bắt buộc: `schema_version`, `trace_id`, `event_type`, `timestamp`, `payload`.
- Freeze field standards cho `Signal`, `RiskDecision`, `ExecutionAck`, `ObservabilityEvent`.

### Phase B - Compatibility bridge
- Cho phép parse `v0` trong giai đoạn chuyển tiếp.
- Với payload `v0`: log compatibility warning + map vào issue nếu thiếu field critical.

### Phase C - Validation & rollout
- Chạy positive/negative/version mismatch tests theo baseline profile.
- Chỉ chuyển sang strict gate khi không còn P0 unowned.

## Mapping rules

| Contract | Legacy shape (`v0`) | Target shape (`v1`) | Compatibility note |
|---|---|---|---|
| Envelope | thiếu `schema_version` hoặc metadata không đủ | đủ 5 field bắt buộc | `v0` parse có cảnh báo trong phase chuyển tiếp |
| Signal | `direction`, `strength`, timestamp int | `action`, `confidence`, timestamp ISO | normalize field tại bridge layer |
| RiskDecision | `approved`, `reason` | `decision`, `reason_code`, `limit_snapshot` | bổ sung context để replay/audit |
| ExecutionAck | thiếu telemetry fields | `order_id`, `route`, `latency_bucket`, `retry_count` | default mapping trong transition logic |
| ObservabilityEvent | `correlation_id` + timestamp drift | `trace_id`, `component`, `severity`, `timestamp`, `payload` | alias mapping cho transition window |

## Exit conditions
- V1 contract tests pass cho critical path.
- Version mismatch behavior được ghi rõ trong baseline report.
- Không còn P0 unowned trong issue register v3.
- `W3-ISS-009` đã Done (policy drift resolved).

---
Last updated: 2026-04-23
