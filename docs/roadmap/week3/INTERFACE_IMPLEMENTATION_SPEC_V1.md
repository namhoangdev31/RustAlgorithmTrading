# Interface Implementation Spec v1 (Week 3)

## Scope
Spec triển khai contract `v1` cho tuần 3, tập trung mapping thực thi Python-Rust trên critical path, kèm protocol xử lý lỗi runtime.

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
- Parse theo 2 bước bắt buộc: `envelope -> payload`.
- `v1`: strict required fields.
- `v0`: permissive compatibility adapter trong transition window.

## 2) File-level Edit Contract

| File nhóm | Mục tiêu sửa | Bắt buộc hành vi | Testcase map |
|---|---|---|---|
| `src/bridge/zmq_bridge.py` | Hỗ trợ parse cả v0/v1, normalize field Signal | Không crash hệ thống khi message mismatch | Parser unit + Python->Rust integration |
| `rust/common/src/messaging.rs` | Envelope parser, structured parse error, compatibility path | Không panic; lỗi có mã và trace được | Rust parser unit + cross-runtime contract tests |
| Python logger/decorators | Chuẩn `trace_id` xuyên suốt, giữ alias `correlation_id` trong transition | Structured logging, không mất trace context | Observability unit + integration log checks |

## 3) Contract mapping chuẩn

### Signal
| Field | Python current | Rust current | v1 target |
|---|---|---|---|
| Action | `direction` | `action` | `action` |
| Confidence | `strength` | `confidence` | `confidence` |
| Timestamp | `int` | `DateTime` | `ISO-8601` |

### RiskDecision
| Field | Current | v1 target |
|---|---|---|
| Decision | `approved` bool | `decision` enum |
| Reason | `reason` optional | `reason_code` required |
| Snapshot | missing | `limit_snapshot` required |

### ExecutionAck
| Field | v1 requirement |
|---|---|
| `order_id` | required |
| `route` | required |
| `latency_bucket` | required |
| `retry_count` | required |

### ObservabilityEvent
| Field | v1 requirement |
|---|---|
| `trace_id` | required |
| `component` | required |
| `severity` | required |
| `timestamp` | ISO-8601 required |
| `payload` | required |

## 4) Error-handling protocol (mandatory)

1. `no panic` khi gặp mismatch.
2. Trả lỗi có cấu trúc:
```json
{
  "error_code": "string",
  "trace_id": "string",
  "reason": "string",
  "disposition": "DROP_SAFE|RETRY|QUARANTINE"
}
```
3. Với message reject do sai contract/version: log `trace_id` + `error_code` + raw payload preview tối đa 200 ký tự.
4. Raw payload preview phải qua redaction nếu chứa dữ liệu nhạy cảm.

## 5) Test mapping
- Positive tests cho full v1 payload.
- Negative tests cho missing/invalid fields.
- Version mismatch tests cho `v0` compatibility.
- Cross-runtime tests cho signal/risk/execution/observability handoff.
- Observability tests xác nhận structured error log + trace context.

---
Last updated: 2026-04-23
