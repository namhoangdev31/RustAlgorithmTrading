# Schema Version Baseline Report v1

## Window
- Week 3 schema baseline snapshot.
- Baseline mode: phase-based, không bám lịch thực tế.

## Baseline preflight

| Check | Command | Result | Evidence ID |
|---|---|---|---|
| Python cache cleanup | `find . -name "__pycache__" -exec rm -rf {} +` | `PENDING_EXECUTION` | `EV-W3-001` |
| Rust clean-slate | `cd rust && cargo clean -p common -p signal-bridge -p risk-manager -p execution-engine` | `PENDING_EXECUTION` | `EV-W3-002` |

## Command evidence set

| Command group | Command | Expected | Actual | Status | Clean-slate | Mapped issue | Evidence ID |
|---|---|---|---|---|---|---|---|
| Python signal flow | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | Signal contract handoff pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `true` | `W3-ISS-001`,`W3-ISS-002` | `EV-W3-101` |
| Python observability flow | `python -m pytest tests/integration/test_observability_integration.py -q` | Trace envelope consistency pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `true` | `W3-ISS-005` | `EV-W3-102` |
| Rust contract crates | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge -p risk-manager -p execution-engine` | Parser/contract tests pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `true` | `W3-ISS-001`,`W3-ISS-003`,`W3-ISS-004` | `EV-W3-103` |
| Rust workspace check | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | Workspace compatible | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `true` | `W3-ISS-009` | `EV-W3-104` |
| Runtime health smoke | `bash scripts/health_check.sh` | Health checks green | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `true` | `W3-ISS-005` | `EV-W3-105` |

## Test matrix (schema-focused)

| Category | Scenario | Expected | Status | Evidence ID | Issue mapping |
|---|---|---|---|---|---|
| Positive | v1 payload đủ field bắt buộc | Parse pass | `PENDING_EXECUTION` | `EV-W3-201` | `W3-ISS-001` |
| Negative | thiếu field bắt buộc | Fail đúng `error_code`, không panic | `PENDING_EXECUTION` | `EV-W3-202` | `W3-ISS-006` |
| Negative | sai type field | Fail đúng `error_code`, không panic | `PENDING_EXECUTION` | `EV-W3-203` | `W3-ISS-006` |
| Negative | sai enum/casing | Fail đúng `error_code`, không panic | `PENDING_EXECUTION` | `EV-W3-204` | `W3-ISS-006` |
| Negative | timestamp sai format | Fail đúng `error_code`, không panic | `PENDING_EXECUTION` | `EV-W3-205` | `W3-ISS-006` |
| Versioning | gửi v0 vào receiver v1 | Parse qua compatibility path + warning | `PENDING_EXECUTION` | `EV-W3-206` | `W3-ISS-001`,`W3-ISS-002` |
| Cross-runtime | Python publish -> Rust consume | Không crash, mapping đúng | `PENDING_EXECUTION` | `EV-W3-207` | `W3-ISS-002`,`W3-ISS-003` |
| Cross-runtime | Rust emit -> Python parse | Parse đúng Risk/Ack/Obs | `PENDING_EXECUTION` | `EV-W3-208` | `W3-ISS-003`,`W3-ISS-004`,`W3-ISS-005` |
| Observability | Mismatch log quality | Có `trace_id` + structured error + payload preview redacted | `PENDING_EXECUTION` | `EV-W3-209` | `W3-ISS-005` |

## Decision
- Chỉ được chuyển gate khi toàn bộ scenario bắt buộc đạt `CAPTURED_PASS`.
- Không được kết luận `GO` khi còn bất kỳ evidence ở `PENDING_EXECUTION/CAPTURED_FAIL/BLOCKED_ENV`.

---
Last updated: 2026-04-23
