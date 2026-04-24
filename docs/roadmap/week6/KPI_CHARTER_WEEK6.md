# KPI Charter Week 6 (Stop-loss Coherence)

## Purpose

Khóa KPI vận hành cho W06 để đo mức đồng bộ stop-loss Python/Rust, độ an toàn execution path và chất lượng evidence trước khi mở W07.

## KPI matrix

| KPI | Target | Actual | Status | Evidence ID | Owner |
|---|---|---|---|---|---|
| Compile/static/lint/type profile | `100% pass` | mandatory commands exited `0`; workspace check has warnings only | `GREEN` | `EV-W6-101..106` | `tester` |
| Critical path smoke pass rate | `>=95%` | `17/17` Python integration tests pass across mandatory slices | `GREEN` | `EV-W6-102`,`EV-W6-103` | `tester` |
| Python/Rust stop semantics parity | `100%` mandatory scenarios | 6/6 parity scenarios pass | `GREEN` | `EV-W6-201..208` | `coder` |
| Numeric trigger tolerance | drift `<=1 tick` hoặc tolerance đã freeze | tick frozen at `1e-8`; `0 drift findings` | `GREEN` | `EV-W6-214` | `tester` |
| Price-stream parity harness | same stop outcome by `correlation_id` | harness pass with `correlation_id=w6-parity-cid` | `GREEN` | `EV-W6-110`,`EV-W6-215`,`EV-W6-307` | `tester` |
| Immediate stop-loss regression | `100% pass` | `5/5` pass | `GREEN` | `EV-W6-101`,`EV-W6-205` | `tester` |
| Duplicate stop-order rate | `<=0.1%` | `0%` in replay test scope | `GREEN` | `EV-W6-209`,`EV-W6-302` | `tester` |
| Stop-loss side-effect lớn | `0` | `0` major side-effect observed in mandatory suites | `GREEN` | `EV-W6-210`,`EV-W6-303` | `ops` |
| Stale stop cleanup | `PositionClosed`/`quantity=0` cleanup `100% pass` | cleanup + LimitChecker tests pass | `GREEN` | `EV-W6-211`,`EV-W6-216`,`EV-W6-308` | `coder` |
| Stop event correlation continuity | `100%` | compliance pass + source audit `0 findings` | `GREEN` | `EV-W6-107`,`EV-W6-108`,`EV-W6-109`,`EV-W6-212` | `ops` |
| Stop trigger latency overhead | `<=0.2ms` vs W05 watermark if measurable | nearest risk overhead guard pass | `GREEN` | `EV-W6-306` | `ops` |
| Change budget compliance | `<=15 files`, `<=800 LOC net` | file-count exceeded; LOC within threshold; `ESC-W6-001` accepted | `GREEN` | `EV-W6-401` | `planner` |
| Artifact consistency | one final decision | baseline/issue/gate/final all `GO` | `GREEN` | `EV-W6-304` | `planner` |

## KPI interpretation

- `GREEN`: target met with valid evidence ID.
- `YELLOW`: target partially met or pending rerun, no open P0.
- `RED`: target failed, P0 open, P1 unowned, or evidence missing for mandatory gate item.

## Gate KPI minimum

W06 được `GO` vì:

1. Tất cả KPI mandatory ở trạng thái `GREEN`.
2. Không còn P0 open.
3. Không có P1 unowned.
4. Không còn `CAPTURED_FAIL/BLOCKED_ENV` ở matrix bắt buộc.
5. Baseline, issue register, gate notes và final report cùng một quyết định cuối: `GO`.
