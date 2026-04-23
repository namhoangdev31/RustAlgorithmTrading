# Interface Implementation Spec v1 (Week 3)

## Scope
Spec triển khai contract `v1` cho tuần 3, tập trung mapping thực thi giữa Python-Rust trên critical path.

## 1) Envelope implementation target

```json
{
  "schema_version": "v1",
  "trace_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

Implementation requirements:
- Reject path cho payload thiếu field bắt buộc ở strict mode.
- `v0` path vẫn parse được trong transition window với warning.

## 2) Signal implementation mapping

| Field | Python current | Rust current | v1 target |
|---|---|---|---|
| Action | `direction` | `action` | `action` |
| Confidence | `strength` | `confidence` | `confidence` |
| Timestamp | `int` | `DateTime` | `ISO-8601` |

Implementation notes:
- Mapping thực hiện tại bridge serialization/deserialization.
- Side/action semantics giữ thống nhất với enum Rust.

## 3) RiskDecision implementation mapping

| Field | Current | v1 target |
|---|---|---|
| Decision | `approved` bool | `decision` enum |
| Reason | `reason` optional | `reason_code` required for reject |
| Snapshot | missing | `limit_snapshot` required |

Implementation notes:
- Reject branch bắt buộc có `reason_code`.
- `limit_snapshot` đủ dữ liệu để replay/audit.

## 4) ExecutionAck implementation mapping

| Field | v1 requirement |
|---|---|
| `order_id` | required |
| `route` | required |
| `latency_bucket` | required |
| `retry_count` | required |

Implementation notes:
- Telemetry fields không được drop ở handoff path.
- Mapping default chỉ dùng cho transition fallback, phải được log.

## 5) ObservabilityEvent implementation mapping

| Field | v1 requirement |
|---|---|
| `trace_id` | required |
| `component` | required |
| `severity` | required |
| `timestamp` | ISO-8601 required |
| `payload` | required |

Implementation notes:
- Alias `correlation_id -> trace_id` chỉ tồn tại trong transition window.
- Severity mapping phải đồng nhất giữa Python và Rust logs.

## Test mapping
- Positive tests cho full v1 payload.
- Negative tests cho missing/invalid fields.
- Version mismatch tests cho `v0` compatibility.
- Cross-runtime tests cho signal/risk/execution/observability handoff.

---
Last updated: 2026-04-23
