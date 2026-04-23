# Interface Risk Limits Spec (Week 5)

## 1) Canonical envelope (freeze)

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

## 2) Stability policy W05

1. Không đổi public wire-shape trong W05 trừ khi có trigger P0/P1 risk.
2. Mọi interface/type change phải có `CR-W05-###` + evidence.
3. Không re-introduce `trace_id`; toàn bộ tracking dùng `correlation_id`.
4. Ưu tiên adapter nội bộ tại boundary hơn thay đổi contract công khai.

## 3) Risk limits contract requirements

### Decision payload bắt buộc
- `decision` (`ALLOW`|`REJECT`)
- `reason_code` (enum policy-driven)
- `limit_snapshot` (chứa giới hạn và giá trị thực tế tại thời điểm reject)

### Canonical enum contract (khóa compile-time)
- `Decision` enum canonical: `ALLOW`, `REJECT`.
- `ReasonCode` enum canonical (minimum set):
  - `SYMBOL_POSITION_LIMIT_EXCEEDED`
  - `SYMBOL_VOLUME_LIMIT_EXCEEDED`
  - `STRATEGY_MAX_DRAWDOWN_BREACH`
  - `STRATEGY_DAILY_LOSS_LIMIT_BREACH`
  - `STRATEGY_ALLOCATION_LIMIT_EXCEEDED`
  - `INVALID_ORDER_PARAMETERS`
- Nguồn chuẩn enum: `rust/common/src/types.rs` (Rust). Python adapter map đúng 1-1 theo enum canonical, không dùng string tự do.

### Behavioral rules
1. Nếu vượt symbol cap hoặc strategy cap thì `decision=REJECT`.
2. Mọi reject phải có `reason_code` và `limit_snapshot`.
3. Reject path không được tạo duplicate order.
4. Mọi reject log bắt buộc có `correlation_id`.
5. Bridge phải fail-fast: message có `disposition=REJECT` bị chặn trước execution layer.
6. `limit_snapshot` phải redaction ở public logs; chỉ full payload ở internal secure logs.

## 4) File-level implementation contract

| File | Mục tiêu | Cho phép chỉnh | Không được chỉnh | Testcase bắt buộc |
|---|---|---|---|---|
| `rust/risk-manager/src/limits.rs` và module liên quan | enforce symbol/strategy caps | bổ sung/check policy logic | refactor lan rộng ngoài scope W05 | risk-manager tests + risk matrix |
| `rust/execution-engine/src/*` | reject semantics downstream | hardening reject handling/disposition | đổi public shape của ack nếu không có CR | execution/risk integration checks |
| `src/bridge/zmq_bridge.py` | risk-reject ack mapping + fail-fast reject | adapter mapping + structured reject path + pre-execution reject short-circuit | đổi canonical envelope | backtest signal flow + reject path checks |
| `src/observability/logging/structured_logger.py` + `src/observability/logging/formatters.py` | correlation continuity trên reject events + redaction | bổ sung context fields/redaction cho `limit_snapshot` | thêm tracking ID mới ngoài correlation_id | observability integration + audit |

## 5) Error-handling protocol (không đổi)

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
1. Không panic ở mismatch/reject path.
2. Reject có cấu trúc và drop-safe.
3. Log lỗi/reject bắt buộc có `correlation_id`, `reason_code`, `error_code` khi có.
4. Payload preview tối đa 200 ký tự, đã redaction.
5. Public logs bắt buộc mask các key nhạy cảm trong `limit_snapshot` (`equity`, `available_buying_power`, `strategy_budget`).

---
Last updated: 2026-04-23 (W05 interface/spec sync)
