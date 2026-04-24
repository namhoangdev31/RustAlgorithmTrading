# Interface Circuit Breaker Spec (Week 7)

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

## 2) Stability policy W07

1. Không đổi public wire-shape trong W07 trừ khi có trigger P0/P1 risk.
2. Mọi interface/type change phải có `CR-W07-###` + evidence.
3. Toàn bộ tracking công khai dùng `correlation_id`.
4. Ưu tiên adapter/internal state hardening hơn thay đổi contract công khai.

## 3) Circuit breaker contract requirements

### Circuit breaker event payload minimum

- `disposition` (`ALLOW`|`REJECT`|`DROP_SAFE`|`RESET_PENDING`)
- `reason_code` (enum/policy token ổn định)
- `previous_state` (`CLOSED`|`OPEN`|`HALF_OPEN`|`RESET_PENDING`|`DISABLED`)
- `next_state` (`CLOSED`|`OPEN`|`HALF_OPEN`|`RESET_PENDING`|`DISABLED`)
- `trigger_source` (`DAILY_LOSS`|`MANUAL`|`EMERGENCY`|`RISK_FAILURE`|`SYSTEM_HEALTH` nếu codebase hỗ trợ)
- `cooldown_remaining_ms` nếu state liên quan cooldown
- `correlation_id`

### Behavioral rules

1. `CLOSED` cho phép order hợp lệ đi tiếp nếu risk limits pass.
2. `OPEN` reject order mới trước execution.
3. Reset trước cooldown phải fail-safe.
4. `HALF_OPEN` chỉ cho phép probe có kiểm soát nếu codebase hỗ trợ.
5. Probe pass mới về `CLOSED`; probe fail quay lại `OPEN`.
6. Manual reset cần owner/approval evidence trong runbook.
7. Circuit breaker không rewrite active stop state hoặc risk limit config khi không liên quan decision mới.
8. Mọi event/log bắt buộc có `correlation_id`.

## 4) File-level implementation contract

| File | Mục tiêu | Cho phép chỉnh | Không được chỉnh | Testcase bắt buộc |
|---|---|---|---|---|
| `rust/risk-manager/src/circuit_breaker.rs` | state machine + cooldown/recovery | bổ sung state nội bộ, timers, reason codes nếu cần | đổi public envelope nếu không có CR | risk-manager circuit tests |
| `rust/risk-manager/src/lib.rs` | breaker reject path + RiskReport reason | structured reject, metrics/logging | đổi RiskReport shape nếu không có CR | risk-manager + integration risk path |
| `rust/common/src/types.rs` | canonical reason/status enum nếu thiếu | thêm enum token P0/P1 justified | đổi token cũ không có adapter | common/risk tests |
| `rust/common/src/metrics.rs` | trip/status metrics scrape | labels canonical | metric name drift không adapter | compliance/observability audit |
| `rust/execution-engine/*` | prove no execution side-effect while breaker reject | guard/adapters | đổi execution ack shape nếu không có CR | execution/risk suites |
| `docs/operations/OPERATIONS_RUNBOOK.md` hoặc W07 notes | reset drill + approval | cập nhật procedure | reset không evidence | gate rehearsal |

## 5) Error-handling protocol

```json
{
  "error_code": "CIRCUIT_BREAKER_OPEN|RESET_DENIED|COOLDOWN_ACTIVE|INVALID_RESET_REQUEST",
  "correlation_id": "string",
  "reason": "string",
  "disposition": "REJECT|DROP_SAFE|RESET_PENDING",
  "payload_preview": "string<=200(redacted)"
}
```

### Runtime rules

1. Không panic ở mismatch/manual reset input lỗi.
2. Reject/drop có cấu trúc và drop-safe.
3. Log lỗi/event bắt buộc có `correlation_id`, `reason_code`, `previous_state`, `next_state` khi có transition.
4. Payload preview tối đa 200 ký tự, đã redaction.
5. Config reload không được tự động đóng breaker đang `OPEN` nếu chưa qua recovery/reset policy.

## 6) State and recovery coherence protocol

1. Transition boundary phải test `CLOSED -> OPEN`, `OPEN -> HALF_OPEN`, `HALF_OPEN -> CLOSED`, `HALF_OPEN -> OPEN`.
2. Nếu codebase hiện tại chưa hỗ trợ `HALF_OPEN`, W07 phải ghi rõ compatibility path hoặc mở `CR-W07-###` trước implementation.
3. Stress scenario phải chứng minh repeated trip/recover không flapping/loop-trip.
4. Runbook reset drill phải chứng minh reset có owner, root-cause note và evidence.
