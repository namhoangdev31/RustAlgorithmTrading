# Circuit Breaker Implementation Plan (Week 7)

## Mục tiêu

Triển khai Circuit Breaker Hardening theo hướng thay đổi tối thiểu, tập trung state machine, cooldown/recovery, execution guard và observability evidence.

## Dependency matrix

| Lane | Scope | Dependency | Merge condition |
|---|---|---|---|
| Lane 1 | Rust circuit breaker state machine + transition rules | W05/W06 risk path stable | transition matrix `CAPTURED_PASS` |
| Lane 2 | Trip triggers + cooldown/recovery policy | Lane 1 state freeze | trip/cooldown/recovery scenarios pass |
| Lane 3 | Execution guard khi breaker `OPEN` | Lane 1 + Lane 2 | no execution side-effect, duplicate rate `<=0.1%` |
| Lane 4 | Observability, metrics, runbook reset drill, artifact sync | Lane 1 + Lane 2 + Lane 3 | correlation audit `0 findings` + one-decision gate |

## Triage cluster mapping

| Cluster | Định nghĩa | Severity mặc định | Gate impact |
|---|---|---|---|
| A - Incompatibility | Breaker không trip, không reject, crash/stall hoặc bypass execution guard | P0 | blocking |
| B - SemanticDrift | Sai state, cooldown, reason_code, reset policy hoặc W05/W06 interaction | P1 | blocking nếu ảnh hưởng safety path |
| C - ObservabilityGap | Thiếu `correlation_id`, metrics/status, runbook evidence hoặc audit trail | P1/P2 | blocking nếu che mờ P0/P1 root cause |

## Rollback strategy

1. Snapshot baseline trước rollout lane mới.
2. Trigger rollback: order vẫn đi execution khi breaker `OPEN`, loop-trip count > 0, false reset trước cooldown, hoặc stress fail P0.
3. Rollback action: revert lane gần nhất, restore W06 risk/stop guardrails, rerun command profile.
4. Exit rollback: command profile + circuit breaker scenario matrix tối thiểu `CAPTURED_PASS`.
5. Trigger rollback hiệu năng: breaker check overhead > 0.2ms nếu đo được và không có mitigation rõ.

## Rollback trigger/action per lane

| Lane | Trigger | Detection window | Rollback action | Success criteria |
|---|---|---|---|---|
| Lane 1 | State transition sai hoặc panic | 1 chu kỳ transition matrix | rollback state machine patch lane 1 | state matrix pass |
| Lane 2 | Cooldown/recovery fail hoặc reason drift | 1 chu kỳ scenario tests | rollback trigger/cooldown patch lane 2 | trip/cooldown/recovery pass |
| Lane 3 | Execution side-effect hoặc duplicate order | 1 chu kỳ smoke + replay | rollback execution guard patch lane 3 | no execution side-effect |
| Lane 4 | Correlation/metric/runbook evidence fail hoặc docs mâu thuẫn | 1 chu kỳ gate | rollback latest observability/governance patch | audit = 0 + one-decision gate |

## Implementation steps

1. Freeze circuit breaker semantics và acceptance criteria.
2. Freeze state dictionary: `CLOSED`, `OPEN`, `HALF_OPEN`, `RESET_PENDING`, `DISABLED` nếu cần compatibility.
3. Capture baseline command profile.
4. Triển khai lane 1 -> lane 2 -> lane 3 -> lane 4 theo dependency.
5. Chạy stress scenario repeated trip/recover, fail nếu loop-trip/flapping.
6. Chạy runbook reset drill có approval/owner/evidence.
7. Triage mismatch và cập nhật issue register theo evidence.
8. Gate rehearsal, chốt một trạng thái cuối.

## File-level edit guide

| Owner path | Cần sửa khi có evidence | Không được làm | Testcase bắt buộc |
|---|---|---|---|
| `rust/risk-manager/src/circuit_breaker.rs` | State machine, cooldown, trip/recover behavior | refactor toàn bộ risk manager | `cargo test -p risk-manager` + state matrix |
| `rust/risk-manager/src/lib.rs` | Ensure breaker reject path dùng `correlation_id` và reason canonical | đổi public risk report shape nếu không có CR | risk-manager tests + integration risk path |
| `rust/execution-engine/*` | Guard/verify no execution side-effect khi reject do breaker | đổi order ack shape nếu không có CR | `cargo test -p execution-engine -p risk-manager` |
| `rust/common/src/metrics.rs` và observability path | metrics trip/status scrape đủ labels | thêm ID tracking mới | compliance + observability integration |
| `docs/operations/OPERATIONS_RUNBOOK.md` hoặc W07 runbook notes | reset drill, approval, root-cause review | reset “cho nhanh” không evidence | gate rehearsal + final report evidence |

## State machine policy

1. `CLOSED`: breaker cho phép risk checks tiếp tục nếu limits pass.
2. `OPEN`: breaker reject toàn bộ order mới trước execution.
3. `HALF_OPEN`: chỉ cho phép probe có kiểm soát nếu codebase hỗ trợ; nếu chưa hỗ trợ, W07 phải ghi rõ compatibility path hoặc CR.
4. `RESET_PENDING`: trạng thái governance/ops nếu manual reset cần approval trước khi về `CLOSED`.
5. `DISABLED`: chỉ dùng khi config explicit; phải log warning và không được dùng trong controlled-live path nếu chưa có approval.

## Cooldown/recovery policy

1. Reset trước cooldown phải fail-safe.
2. Recovery phải ghi reason, previous_state, next_state, `correlation_id`.
3. Probe pass mới được về `CLOSED`; probe fail quay lại `OPEN`.
4. Repeated trip/recover stress phải có loop-trip count `=0`.

## Observability policy

Circuit breaker event/log/metric bắt buộc có:

- `correlation_id`
- `previous_state`
- `next_state`
- `reason_code`
- `disposition` (`ALLOW`, `REJECT`, `DROP_SAFE`, `RESET_PENDING`)
- timestamp ISO-8601 hoặc runtime timestamp chuẩn hiện hữu

## Performance watermark guardrail

1. Benchmark breaker check path tại baseline W07 nếu có harness.
2. Benchmark lại sau rollout.
3. Chỉ chấp nhận `GO` khi overhead `<=0.2ms` nếu measurable hoặc có mitigation rõ.
4. Nếu chưa có harness đo chính xác, ghi `BLOCKED_ENV` và không dùng KPI performance làm pass giả.

## Change-budget control

- Budget W07: `<=15 files`, `<=800 LOC net`.
- Vượt budget phải mở escalation record có owner/mitigation/evidence.
- Không đổi interface public nếu chưa có `CR-W07-###`.

## Lane outcomes (closeout)

| Lane | Outcome | Status | Evidence |
|---|---|---|---|
| Lane 1 | State machine hardening | `CAPTURED_PASS` | `EV-W7-201..209`,`EV-W7-301` |
| Lane 2 | Trip/cooldown/recovery policy | `CAPTURED_PASS` | `EV-W7-202..209`,`EV-W7-302` |
| Lane 3 | Execution side-effect guard | `CAPTURED_PASS` | `EV-W7-203`,`EV-W7-303` |
| Lane 4 | Observability/runbook/artifact reconciliation | `CAPTURED_PASS` | `EV-W7-106..108`,`EV-W7-213..215`,`EV-W7-304..305` |
