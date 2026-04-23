# Interface Stability Spec (Week 4)

## 1) Canonical wire envelope (freeze)

```json
{
  "schema_version": "v1.0.0",
  "correlation_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

### Required fields

- `schema_version`
- `correlation_id`
- `event_type`
- `timestamp`
- `payload`

## 2) Stability policy W04

1. Không đổi public wire-shape trong W04 trừ khi có trigger P0/P1 risk.
2. Nếu buộc phải đổi interface/type: bắt buộc có `CR-W04-###` và evidence tương ứng.
3. `trace_id` không được tái đưa vào public contract; mọi tracking dùng `correlation_id`.
4. Ưu tiên adapter tại boundary hơn thay đổi contract công khai.

## 3) File-level stabilization contract

| File | Mục tiêu ổn định | Cho phép chỉnh | Không được chỉnh | Testcase bắt buộc |
|---|---|---|---|---|
| `src/bridge/zmq_bridge.py` | giữ flow `envelope -> payload`, drop-safe reject có cấu trúc | hardening parser/reconnect handling | đổi field công khai ngoài spec freeze | parser + integration signal flow |
| `rust/common/src/messaging.rs` | giữ parser behavior nhất quán, không panic | cải thiện structured error và resilience handling | thay đổi contract fields công khai không có CR | rust common tests + cross-runtime checks |
| `rust/risk-manager/src/*` | ổn định handshake từ signal sang decision | fix mismatch runtime thực tế, không đổi semantics công khai | refactor risk policy lan rộng ngoài scope W04 | risk-manager tests + integration |
| `rust/execution-engine/src/*` | ổn định ack path, retry path | hardening retry/backoff/disposition theo policy hiện hành | đổi shape `ExecutionAck` công khai | execution-engine tests + integration |
| `src/observability/logging/structured_logger.py` | đảm bảo correlation continuity | bổ sung structured error context, redaction | log raw payload nhạy cảm, thêm ID tracking mới | observability integration + correlation audit |

## 4) Error-handling protocol (không đổi)

```json
{
  "error_code": "string",
  "correlation_id": "string",
  "reason": "string",
  "disposition": "DROP_SAFE|RETRY|QUARANTINE",
  "payload_preview": "string<=200(redacted)"
}
```

### Runtime rules

1. Không panic ở mismatch path.
2. Reject có cấu trúc và drop-safe.
3. Log lỗi bắt buộc có `correlation_id` + `error_code` + `reason`.
4. Payload preview tối đa 200 ký tự, đã redaction.

## 5) Interface/type change guardrail

- Chỉ mở thay đổi nếu có bằng chứng trigger P0/P1 risk.
- Mọi thay đổi phải map vào:
  1. impact runtime,
  2. compatibility path,
  3. rollback plan,
  4. testcase update,
  5. evidence ID.

---
Last updated: W04 no-date mode sync
