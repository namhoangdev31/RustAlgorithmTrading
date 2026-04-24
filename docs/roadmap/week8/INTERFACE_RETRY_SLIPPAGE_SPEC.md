# Interface Retry/Slippage Spec (Week 8)

## 1) Contract freeze

Public envelope giữ nguyên:

```json
{
  "schema_version": "v1.0.0",
  "correlation_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

W08 không đổi public wire-shape. Nếu cần đổi internal Rust API để truyền retry context hoặc classification context, mở `CR-W08-001` nhưng không đổi public envelope.

## 2) Execution event semantics

Execution retry/slippage event bắt buộc có context sau trong log/event nội bộ:

- `correlation_id`
- `client_order_id`
- `attempt`
- `max_attempts`
- `reason_code`
- `disposition`
- `route`
- optional `slippage_bps`

Token chuẩn:

- `disposition`: `ALLOW`, `RETRY`, `REJECT`, `DROP_SAFE`
- `reason_code`: `NETWORK_TRANSIENT`, `RATE_LIMIT`, `EXCHANGE_5XX`, `RISK_OFF`, `SLIPPAGE_BREACH`, `ORDER_VALIDATION`, `CONFIGURATION`, `AUTH`, `PARSE_ERROR`, `MAX_ATTEMPTS_EXHAUSTED`

## 3) Retry behavior contract

1. Retry chỉ áp dụng cho lỗi retryable đã classify rõ.
2. Non-retryable errors phải return ngay, không sleep/retry.
3. Attempt count không được vượt `max_attempts`.
4. Backoff phải cap theo policy hiện hành.
5. Mỗi retry cùng logical order phải giữ stable `client_order_id`.
6. Unknown exchange outcome phải fail-safe; không blind duplicate submit nếu không có idempotency guard.
7. Breaker risk-off từ W07 là terminal non-retryable condition.

## 4) Slippage behavior contract

1. Slippage calculation chỉ chấp nhận finite positive prices.
2. Invalid market price hoặc limit price phải reject có cấu trúc.
3. `slippage_bps > max_slippage_bps` phải reject trước exchange route.
4. NaN/Inf không được propagate vào route/send.
5. Slippage estimator có thể giữ internal implementation hiện tại nếu tests chứng minh boundary behavior đúng.

## 5) W05/W06/W07 interaction contract

| Prior week | Guardrail W08 |
|---|---|
| W05 Risk Limits | risk reject final, không retry |
| W06 Stop-loss | close intent replay không duplicate close order |
| W07 Circuit Breaker | `OPEN/RESET_PENDING` block retry before execution |

## 6) File-level edit contract

| File | Allowed change | Forbidden change |
|---|---|---|
| `rust/execution-engine/src/retry.rs` | retry classification/context/backoff hardening | đổi public envelope hoặc retry mọi error mặc định |
| `rust/execution-engine/src/router.rs` | pre-route slippage/risk-off/idempotency guard | route order khi validation/risk/slippage failed |
| `rust/execution-engine/src/slippage.rs` | finite/positive boundary guard and tests | đổi order model public shape |
| `rust/execution-engine/src/stop_loss_executor.rs` | duplicate close guard if evidence fail | đổi stop-loss contract W06 |
| `rust/common/src/metrics.rs` | add internal metrics if needed | label drift phá dashboard hiện có |

## 7) Error-handling protocol

- Không panic.
- Không retry non-retryable.
- Reject/drop-safe phải có structured reason.
- Log lỗi phải có `correlation_id` và `client_order_id` khi available.
- Raw payload/order preview nếu log phải redacted theo policy hiện hành.
