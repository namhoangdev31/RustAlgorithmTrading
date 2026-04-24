# Interface Stop-loss Spec (Week 6)

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

## 2) Stability policy W06

1. Không đổi public wire-shape trong W06 trừ khi có trigger P0/P1 risk.
2. Mọi interface/type change phải có `CR-W06-###` + evidence.
3. Toàn bộ tracking công khai dùng `correlation_id`.
4. Ưu tiên adapter nội bộ tại boundary hơn thay đổi contract công khai.

## 3) Stop-loss contract requirements

### Stop event payload minimum

- `disposition` (`STOP_TRIGGERED`|`NO_ACTION`|`DROP_SAFE`)
- `reason_code` (enum/policy token ổn định)
- `stop_type` (`STATIC`|`TRAILING`|`ABSOLUTE`|`MAX_LOSS`)
- `side` (`LONG`|`SHORT`)
- `trigger_price`
- `current_price`
- `position_id` hoặc key position tương đương nếu codebase hiện tại đã có

### Behavioral rules

1. Static long stop trigger khi `current_price <= trigger_price`.
2. Static short stop trigger khi `current_price >= trigger_price`.
3. Trailing long trigger chỉ được nâng theo hướng có lợi, không hạ xuống.
4. Trailing short trigger chỉ được hạ theo hướng có lợi, không nâng lên.
5. Stop-loss safety path không bị trì hoãn bởi rule holding-period thông thường.
6. Một stop trigger hợp lệ chỉ được tạo một execution intent/ack cho cùng position event.
7. Khi nhận `PositionClosed` hoặc `PositionUpdate(quantity=0)`, stop state tương ứng phải được cleanup hoặc vô hiệu hóa.
8. Nếu Python dùng float và Rust dùng decimal/fixed precision, trigger chỉ pass khi lệch không quá `1 tick` hoặc tolerance đã freeze.
9. Mọi stop event/log bắt buộc có `correlation_id`.

## 4) File-level implementation contract

| File | Mục tiêu | Cho phép chỉnh | Không được chỉnh | Testcase bắt buộc |
|---|---|---|---|---|
| `rust/risk-manager/src/stops.rs` và module liên quan | stop semantics và state cleanup | bổ sung/check policy logic | refactor toàn bộ risk manager | risk-manager stop scenario tests |
| `rust/execution-engine/src/stop_loss_executor.rs` và module execution liên quan | stop trigger -> execution intent/ack an toàn | duplicate guard, ack consistency | đổi public ack shape nếu không có CR | execution/risk integration checks |
| `src/backtesting/*`, `src/strategies/*` | immediate stop-loss behavior trong Python path | chỉnh logic stop-loss critical path | đổi signal strategy ngoài scope W06 | immediate stop regression test |
| `src/observability/*` | stop event correlation + structured reason | bổ sung context/log formatter nếu thiếu | thêm ID tracking mới | observability integration + audit |
| `scripts/verify_parity_w6.py` hoặc harness tương đương | parity check bằng price stream chung | hardcode pass hoặc bỏ qua tolerance | parity harness + numeric tolerance evidence |

## 5) Error-handling protocol

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

1. Không panic ở mismatch/edge stop input.
2. Reject/drop có cấu trúc và drop-safe.
3. Log lỗi/stop bắt buộc có `correlation_id`, `reason_code`, `error_code` khi có.
4. Payload preview tối đa 200 ký tự, đã redaction.
5. Không rewrite active stop state khi config reload fail hoặc không liên quan decision mới.

## 6) Numeric and state coherence protocol

1. Trigger boundary phải được test quanh `trigger - 1 tick`, `trigger`, `trigger + 1 tick` nếu instrument metadata hỗ trợ tick size.
2. Nếu chưa có tick metadata, W06 phải freeze tolerance mặc định trước khi implementation rollout.
3. Parity harness phải dùng cùng `correlation_id` cho cùng price stream để đối chiếu Python/Rust.
4. State audit phải chứng minh stop cũ không sống lại khi mở vị thế mới cùng symbol sau closure.
