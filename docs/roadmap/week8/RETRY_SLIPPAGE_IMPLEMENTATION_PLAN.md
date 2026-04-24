# Retry/Slippage Implementation Plan (Week 8)

## Summary

Triển khai Execution Retry/Slippage Hardening theo hướng thay đổi tối thiểu, tập trung retry classification, idempotency, slippage guardrails, circuit breaker interaction và observability evidence.

## File-level implementation guide

| File | Cần sửa nếu evidence fail | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `rust/execution-engine/src/retry.rs` | retry classification, attempt metadata, bounded backoff | optional `RetryContext`/classification adapter nếu cần | retry risk/validation/slippage errors | retry transient, max attempts, non-retryable | `EV-W8-201..206` |
| `rust/execution-engine/src/router.rs` | idempotency guard, slippage pre-route reject, stable client order id | route-level guard for non-retryable errors | gửi order tới exchange khi slippage/risk-off reject | duplicate guard, slippage breach, route no-send | `EV-W8-207..212` |
| `rust/execution-engine/src/slippage.rs` | validate NaN/Inf/negative inputs, reduce noisy warnings nếu cần | boundary helper hoặc structured estimator result nếu needed | đổi public order shape | slippage valid/breach/NaN/Inf | `EV-W8-210..213` |
| `rust/execution-engine/src/stop_loss_executor.rs` | replay duplicate close order guard nếu evidence fail | stop-close idempotency check | tạo close order mới cho cùng trigger replay | stop-loss close replay | `EV-W8-214` |
| `rust/risk-manager/src/lib.rs` | chỉ đọc/consume breaker state nếu cần integration guard | no public wire change | bypass W07 breaker state | W07 regression | `EV-W8-209`,`EV-W8-217` |
| `rust/common/src/metrics.rs` | retry/slippage metric labels nếu thiếu | metric tests nếu metrics mới | metric label drift | metrics scrape | `EV-W8-305` |
| `tests/integration/*` hoặc `rust/execution-engine/tests/*` | thêm tests gần execution path | package-scoped tests nếu cần | root-spill test file | integration + crate tests | `EV-W8-301..307` |
| `PLAYBOOK.md` | sync file mapping khi tạo file mới | file role/test mapping | bỏ qua file mới | doc/code/test mapping | `EV-W8-402` |

## Dependency matrix

| Lane | Depends on | Unlocks | Hard stop if fail |
|---|---|---|---|
| Lane 1: Retry classification | baseline evidence | idempotency rollout | non-retryable error still retries |
| Lane 2: Idempotency | Lane 1 | stress replay | duplicate order/client id drift |
| Lane 3: Slippage guardrails | Lane 1 | route safety | slippage breach routes to exchange |
| Lane 4: W07 breaker interaction | Lane 1 + W07 guardrails | final regression | risk-off bypass |
| Lane 5: Observability/metrics | Lanes 1-4 | W09 handoff | missing `correlation_id`/attempt context |

## Retry classification policy

| Error family | Retry? | Reason |
|---|---|---|
| Network timeout/transient transport | yes | external temporary failure |
| HTTP 5xx/exchange temporary unavailable | yes | exchange transient failure |
| Rate-limit recoverable path | yes with backoff | protect exchange/API |
| Risk reject | no | safety decision must be final |
| Circuit breaker `OPEN/RESET_PENDING` | no | W07 risk-off state |
| Slippage breach | no | guardrail violation |
| Order validation/config/auth error | no | retry cannot fix invalid request |
| Parse response error | no by default unless classified safe | avoid duplicate unknown state |

## Idempotency policy

1. Retry cùng logical order phải giữ stable `client_order_id`.
2. Attempt metadata có thể tăng, nhưng không được thay đổi identity của order.
3. Nếu exchange outcome unknown, retry policy phải ưu tiên query/order status hoặc fail-safe thay vì blind duplicate submit.
4. Stop-loss close replay phải reuse deterministic client order id từ W06.

## Slippage policy

1. Market price và limit price phải finite, positive nếu dùng để tính bps.
2. `slippage_bps > max_slippage_bps` phải reject trước exchange.
3. NaN/Inf/zero/negative price phải fail có cấu trúc, không panic.
4. Stop orders giữ slippage multiplier nhưng vẫn phải obey max-bps guard nếu có market reference.

## Observability policy

Mọi retry/slippage event quan trọng phải có:

- `correlation_id`
- `client_order_id`
- `attempt`
- `max_attempts`
- `reason_code`
- `disposition` (`ALLOW`, `RETRY`, `REJECT`, `DROP_SAFE`)
- `route`
- optional `slippage_bps`

## Rollback strategy

| Lane | Rollback trigger | Rollback action | Evidence |
|---|---|---|---|
| Retry classification | false non-retryable blocks critical route | revert classification adapter only | rerun `EV-W8-201..206` |
| Idempotency | duplicate/order identity regression | revert client id mutation change | rerun `EV-W8-207..208` |
| Slippage guardrails | valid order falsely blocked | revert boundary guard with failing fixture retained | rerun `EV-W8-210..213` |
| W07 interaction | retry bypasses breaker or blocks closed breaker | revert guard integration, keep tests | rerun `EV-W8-209`,`EV-W8-217` |
| Metrics/logging | metric/log schema regression | revert metric labels, keep event fields | rerun `EV-W8-305` |

## Lane outcomes (initial)

| Lane | Outcome | Status | Evidence |
|---|---|---|---|
| Lane 1 | Retry classification | `CAPTURED_PASS` | `EV-W8-201..206`,`EV-W8-301` |
| Lane 2 | Idempotency/duplicate guard | `CAPTURED_PASS` | `EV-W8-207..208`,`EV-W8-302` |
| Lane 3 | Slippage guardrails | `CAPTURED_PASS` | `EV-W8-210..213`,`EV-W8-303` |
| Lane 4 | W07 breaker interaction | `CAPTURED_PASS` | `EV-W8-209`,`EV-W8-217`,`EV-W8-304` |
| Lane 5 | Observability/metrics/artifact reconciliation | `CAPTURED_PASS` | `EV-W8-106..108`,`EV-W8-305..307` |
