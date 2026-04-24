# Stop-loss Implementation Plan (Week 6)

## Mục tiêu

Triển khai Stop-loss coherence theo hướng thay đổi tối thiểu, tập trung đồng bộ semantics Python/Rust và loại bỏ side-effect execution trên stop path.

## Dependency matrix

| Lane | Scope | Dependency | Merge condition |
|---|---|---|---|
| Lane 1 | Rust stop manager semantics: static/trailing/absolute/max-loss, long/short parity | W05 risk limits stable | stop scenario matrix `CAPTURED_PASS` cho Rust |
| Lane 2 | Python stop-loss immediate exit + backtest parity + numeric tolerance | Lane 1 semantics freeze | Python immediate regression + parity/tolerance matrix pass |
| Lane 3 | Execution side-effect guard: one stop trigger -> one intent/ack | Lane 1 + Lane 2 | duplicate stop-order rate `<=0.1%` |
| Lane 4 | Parity harness + state audit + observability/governance sync | Lane 1 + Lane 2 + Lane 3 | parity harness pass + correlation audit `0 findings` + artifact consistency pass |

## Triage cluster mapping

| Cluster | Định nghĩa | Severity mặc định | Gate impact |
|---|---|---|---|
| A - Incompatibility | Stop trigger không chạy, crash/stall, hoặc không tạo ack/closure | P0 | blocking |
| B - Semantic Drift | Python/Rust hiểu khác stop type, trigger direction, numeric tolerance hoặc threshold | P1 | blocking nếu ảnh hưởng safety path |
| C - Observability Gap | Stop path thiếu correlation/log context hoặc evidence không truy vết được | P1/P2 | blocking nếu che mờ root cause |

## Rollback strategy

1. Snapshot baseline trước rollout lane mới.
2. Trigger rollback: duplicate stop-order rate > 0.1%, stop side-effect lớn > 0, hoặc parity fail P0.
3. Rollback action: revert lane gần nhất, restore W05 guardrails, rerun command profile.
4. Exit rollback: command profile + stop scenario matrix tối thiểu `CAPTURED_PASS`.
5. Trigger rollback hiệu năng: stop trigger overhead > 0.2ms so với W05 watermark nếu đo được.

## Rollback trigger/action per lane

| Lane | Trigger | Detection window | Rollback action | Success criteria |
|---|---|---|---|---|
| Lane 1 | Rust stop semantics sai hoặc panic | 1 chu kỳ stop scenario | rollback stop manager patch lane 1 | Rust stop scenarios pass |
| Lane 2 | Python immediate exit regression, numeric tolerance drift hoặc parity fail | 1 chu kỳ Python regression + parity harness | rollback Python behavior/tolerance patch lane 2 | immediate stop regression + parity harness pass |
| Lane 3 | duplicate stop order hoặc execution ack mismatch | 1 chu kỳ smoke | rollback execution guard patch lane 3 | duplicate rate <=0.1% + ack pass |
| Lane 4 | parity harness drift, state audit fail, correlation findings > 0 hoặc docs mâu thuẫn gate | 1 chu kỳ gate | rollback harness/state/logging/governance patch mới nhất | parity pass + state audit pass + audit = 0 + one-decision gate |

## Implementation steps

1. Freeze stop-loss semantics và acceptance criteria.
2. Freeze numeric tolerance policy: exact price equality, tick-size tolerance, rounding mode và fail condition.
3. Capture baseline command profile.
4. Triển khai lane 1 -> lane 2 -> lane 3 -> lane 4 theo dependency.
5. Tạo/chạy parity harness bằng một price stream chung cho Python và Rust, so sánh stop trigger theo `correlation_id`.
6. Chạy state audit cho `PositionClosed` hoặc `PositionUpdate(quantity=0)`.
7. Triage mismatch và cập nhật issue register theo evidence.
8. Gate rehearsal, chốt một trạng thái cuối.

## File-level edit guide

| Owner path | Cần sửa khi có evidence | Không được làm | Testcase bắt buộc |
|---|---|---|---|
| `rust/risk-manager/src/stops.rs` và module risk liên quan | Đồng bộ stop type, trigger threshold, state cleanup | refactor toàn bộ risk manager | `cargo test -p risk-manager` + stop scenario matrix |
| `rust/execution-engine/src/stop_loss_executor.rs` và execution path liên quan | Đảm bảo stop trigger tạo đúng một intent/ack | đổi public ack shape nếu không có CR | `cargo test -p execution-engine -p risk-manager` |
| `src/backtesting/*`, `src/strategies/*` | Bảo toàn immediate stop-loss exit trong backtest/strategy path | chỉnh strategy logic ngoài stop-loss critical path | `python -m pytest tests/unit/test_week3_stop_loss_immediate_exit.py -q` |
| `src/observability/*` | Bổ sung context stop event nếu thiếu | thêm ID tracking mới | observability integration + correlation audit |
| `scripts/verify_parity_w6.py` hoặc harness tương đương | Gửi cùng price stream qua Python/Rust và so sánh trigger | hardcode kết quả pass, bỏ qua tolerance drift | parity harness `EV-W6-110`,`EV-W6-215`,`EV-W6-307` |

## Numeric tolerance policy

1. Nguồn chuẩn giá/trigger phải dùng cùng tick size theo instrument nếu codebase đã có metadata.
2. Nếu Python dùng float và Rust dùng decimal/fixed precision, kết quả chỉ pass khi trigger lệch không quá `1 tick` hoặc tolerance đã freeze trong spec.
3. Nếu chưa xác định được tick size/tolerance, parity harness phải ghi `CAPTURED_FAIL` hoặc `BLOCKED_ENV`; không được ghi pass bằng so sánh lỏng.
4. Stop trigger boundary phải test cả `trigger - 1 tick`, `trigger`, `trigger + 1 tick` cho long/short khi có thể.

## State audit policy

1. Khi nhận `PositionClosed` hoặc `PositionUpdate(quantity=0)`, stop state tương ứng phải được remove hoặc disable.
2. Nếu mở lại vị thế mới cùng symbol, stop cũ không được tái kích hoạt.
3. Hot-reload config chỉ áp dụng cho quyết định mới; không rewrite `active_stops` đang mở.
4. State audit là gate item, không phải nice-to-have.

## Performance watermark guardrail

1. Benchmark stop trigger/ack path tại baseline W06 nếu có harness (`EV-W6-108`).
2. Benchmark lại sau rollout (`EV-W6-306`).
3. Chỉ chấp nhận `GO` khi overhead `<=0.2ms` so với W05 watermark nếu measurable.
4. W06 đã dùng nearest risk overhead guard làm evidence tạm; nếu cần độ chính xác production hơn, bổ sung microbenchmark riêng ở W07/Wxx.

## Change-budget control

- Budget W06: `<=15 files`, `<=800 LOC net`.
- Vượt budget phải mở escalation record có owner/mitigation/evidence.
- Không đổi interface public nếu chưa có `CR-W06-###`.

## Lane outcomes (captured)

| Lane | Outcome | Status | Evidence |
|---|---|---|---|
| Lane 1 | Rust stop manager semantics parity | `CAPTURED_PASS` | `EV-W6-201..204`,`EV-W6-301` |
| Lane 2 | Python immediate exit + parity + numeric tolerance | `CAPTURED_PASS` | `EV-W6-101`,`EV-W6-205`,`EV-W6-208`,`EV-W6-214` |
| Lane 3 | Execution side-effect guard + stale cleanup | `CAPTURED_PASS` | `EV-W6-209..211`,`EV-W6-302..303`,`EV-W6-308` |
| Lane 4 | Parity harness + observability + artifact reconciliation | `CAPTURED_PASS` | `EV-W6-107..110`,`EV-W6-212`,`EV-W6-215`,`EV-W6-304`,`EV-W6-307` |
