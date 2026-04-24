# Kế Hoạch Vận Hành Tuần 6 (W06, Stop-loss Coherence)

## 1) Mục tiêu tuần

W06 tập trung triển khai **Stop-loss coherence** theo roadmap 24 tuần:

1. Đồng bộ semantics stop-loss giữa Python backtesting/strategy path và Rust risk/execution path.
2. Đảm bảo stop-loss là safety path ưu tiên: trigger đúng, exit không bị trì hoãn bởi rule thường, không tạo duplicate order.
3. Giữ ổn định integration đã chốt ở W04 và Risk Limits v1 đã chốt ở W05.
4. Chốt gate W06 bằng evidence thật để mở W07 (Circuit breaker hardening).
5. Không mở refactor lan rộng; chỉ chỉnh stop-loss/risk/execution/observability critical path khi có evidence P0/P1.

Ràng buộc W06:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W06-###`.
- Ưu tiên adapter/hardening nội bộ, giữ 90-100% codebase hiện hữu.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W06) |
|---|---|
| Change Budget (W05-W08) | `<= 15 files` và `<= 800 LOC net` |
| Compile/Static/Lint/Type | `100% pass` |
| Smoke critical path | `>= 95% pass` |
| Duplicate stop-order rate | `<= 0.1%` |
| Stop-loss side-effect lớn | `= 0` |
| Python/Rust stop semantics parity | `100%` trên matrix bắt buộc |
| Numeric trigger tolerance | Python/Rust không lệch quá `1 tick` hoặc tolerance được spec hóa |
| Stop-loss immediate-exit regression | `100% pass` |
| Stop event correlation continuity | `100%` |
| Stop trigger latency overhead | `<= 0.2ms` so với watermark W05 nếu đo được |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |

---

## 2) Task board theo chu kỳ (W6-T01 -> W6-T18)

### Pha 1: Freeze scope & stop-loss semantics

- `W6-T01` Freeze phạm vi Stop-loss coherence: Python backtest/strategy, Rust risk-manager, Rust execution stop path, observability.
- `W6-T02` Freeze semantics dictionary cho stop types: `STATIC`, `TRAILING`, `ABSOLUTE`, `MAX_LOSS`.
- `W6-T03` Freeze command profile, evidence taxonomy và issue ownership W06.
- `W6-T03A` Freeze numeric tolerance policy cho Python float vs Rust decimal/price tick để tránh stop trigger lệch 1-2 tick.

### Pha 2: Baseline capture

- `W6-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W6-T05` Chạy command profile stop-loss-focused, cập nhật matrix `expected/actual`.
- `W6-T06` Chốt baseline cho Python immediate-exit, Rust stop checks, execution ack và observability path.

### Pha 3: Implementation rollout

- `W6-T07` Lane 1: đồng bộ Rust stop-loss manager semantics (long/short, static/trailing/absolute/max-loss).
- `W6-T08` Lane 2: đồng bộ Python stop-loss behavior, ưu tiên immediate exit không bị minimum holding period chặn.
- `W6-T09` Lane 3: hardening Rust execution stop path để stop trigger chỉ tạo một execution intent/ack hợp lệ.

### Pha 4: Triage & hardening

- `W6-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W6-T11` Hardening duplicate stop-order guardrail + stale stop cleanup khi nhận `PositionClosed` hoặc `PositionUpdate(quantity=0)`.
- `W6-T12` Chạy parity harness một price stream qua Python và Rust, so sánh stop trigger theo `correlation_id`, rồi đóng toàn bộ blocker P0/P1.

### Pha 5: Closure + rerun

- `W6-T13` Rerun baseline sau rollout để xác nhận không regression.
- `W6-T14` Khóa issue register theo evidence thật.

### Pha 6: Gate rehearsal

- `W6-T15` Đồng bộ Baseline -> Issue Register -> Gate Notes -> Final Report.
- `W6-T16` Rehearsal quyết định `GO/NO-GO` theo rule Phase 2.

### Pha 7: Final closeout

- `W6-T17` Xuất final report W06 với một trạng thái gate duy nhất.
- `W6-T18` Chốt Week 7 start pack (circuit breaker priorities + stop-loss guardrails).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- Stop-loss event luôn có `correlation_id`, stop type, reason và disposition trong evidence.
- Python/Rust parity matrix được cập nhật tiến độ mỗi ngày.
- Numeric tolerance drift phải được ghi rõ: exact match, tick tolerance, hoặc `CAPTURED_FAIL`.
- State audit phải kiểm tra `PositionClosed`/`quantity=0` để xóa stop state.
- Duplicate stop-order risk được kiểm tra sau mỗi lane.
- Decision log cuối chu kỳ phản ánh đúng trạng thái runtime.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc đã chạy.
- Python/Rust stop semantics parity = `100%`.
- Parity harness price stream pass, không drift ngoài tolerance.
- Duplicate stop-order rate `<= 0.1%`.
- Stop-loss side-effect lớn = `0`.
- State audit `PositionClosed(quantity=0)` pass.
- Stop event correlation continuity = `100%`.
- Không còn P0 open, không có P1 unowned.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W06

### P0

| ID | Issue | Tác động | Điều kiện đóng W06 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W6-ISS-001` | Stop-loss semantics drift giữa Python và Rust | Chặn safety gate | Parity matrix stop scenarios `CAPTURED_PASS` | `coder` | `Pha 3` |
| `W6-ISS-002` | Duplicate stop order khi trigger/retry | Rủi ro execution | Duplicate stop-order rate `<=0.1%` | `tester` | `Pha 4` |
| `W6-ISS-003` | Stop trigger không tạo ack/closure đúng | Rủi ro giữ vị thế lỗi | Stop trigger -> execution ack -> position closure pass | `coder` | `Pha 3` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W06 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W6-ISS-004` | Trailing stop drift về hướng dịch trigger | Sai logic bảo vệ lợi nhuận | Long/short trailing scenarios pass | `coder` | `Pha 3` |
| `W6-ISS-005` | Immediate exit regression ở Python | Stop bị delay bởi rule thường | Immediate stop-loss test pass | `tester` | `Pha 2` |
| `W6-ISS-006` | Stop-loss observability thiếu context | Khó triage incident | Log/event có `correlation_id`, stop type, reason | `ops` | `Pha 4` |
| `W6-ISS-007` | Stale stop còn tồn tại sau `PositionClosed`/`quantity=0` | Gây trigger sai sau closure | state audit cleanup pass | `coder` | `Pha 4` |
| `W6-ISS-008` | Gate artifacts mâu thuẫn trạng thái | Sai governance | Baseline/Issue/Gate/Final cùng 1 quyết định | `planner` | `Pha 6` |
| `W6-ISS-011` | Hot-reload risk config làm drift stop defaults | Stop defaults không nhất quán | Reload interaction test pass hoặc guardrail ghi rõ | `coder` | `Pha 4` |
| `W6-ISS-012` | Python float vs Rust decimal/tick rounding drift | Stop trigger lệch 1-2 tick | numeric tolerance policy + test pass | `tester` | `Pha 2` |
| `W6-ISS-013` | Thiếu parity harness price stream Python/Rust | Không chứng minh được coherence thật | `scripts/verify_parity_w6.py` hoặc harness tương đương pass | `tester` | `Pha 4` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W06 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W6-ISS-009` | Vượt change budget tuần | Tăng regression risk | Có escalation record hợp lệ hoặc giảm scope | `planner` | `Pha 5` |
| `W6-ISS-010` | Stop trigger latency overhead vượt ngưỡng | Giảm hiệu năng critical path | Overhead `<=0.2ms` hoặc mitigation rõ | `ops` | `Pha 5` |

---

## 5) Test plan W06 (stop-loss-focused)

### Command profile chuẩn

```bash
python -m pytest tests/unit/test_week3_stop_loss_immediate_exit.py -q
python -m pytest tests/integration/test_backtest_signal_flow.py -q
python -m pytest tests/integration/test_observability_integration.py -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p risk-manager
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p execution-engine -p risk-manager
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
bash scripts/compliance_audit.sh --check-correlation --check-versioning
python scripts/audit_correlation.py --fail-on-findings
python scripts/verify_parity_w6.py --fail-on-drift
```

### Scenario bắt buộc

1. Static stop long: price `<= trigger` phải tạo stop event đúng một lần.
2. Static stop short: price `>= trigger` phải tạo stop event đúng một lần.
3. Trailing stop long: trigger chỉ đi theo hướng có lợi.
4. Trailing stop short: trigger chỉ đi theo hướng có lợi.
5. Absolute stop: exact-threshold behavior rõ ràng.
6. Max-loss stop: PnL vượt ngưỡng loss phải stop đúng policy.
7. Python immediate exit: stop-loss không bị minimum holding period trì hoãn.
8. Rust stop trigger -> execution ack -> position closure không tạo duplicate order.
9. Numeric tolerance: Python/Rust không lệch trigger quá `1 tick` hoặc tolerance đã freeze.
10. Stale stop cleanup: `PositionClosed` hoặc `PositionUpdate(quantity=0)` phải xóa/vô hiệu stop state.
11. Parity harness: cùng một price stream qua Python và Rust phải trigger cùng stop event theo `correlation_id`.
12. Observability: stop event có `correlation_id` + structured reason.
13. Safety: malformed/edge stop input drop-safe, không panic.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W06)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W06: `EV-W6-###`
- Interface/type change (nếu có) bắt buộc có `CR-W06-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W6-T01..W6-T18`.
4. Issue Register snapshot.
5. Rehearsal results (stop semantics parity, execution side-effects, observability).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 7 Start Pack.

---

## 7) KPI dictionary W06

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- Duplicate Stop-order Rate.
- Stop-loss Side-effect Count.

### Risk Quality

- Python/Rust Stop Semantics Parity.
- Numeric Trigger Tolerance Compliance.
- Price Stream Parity Harness Pass Rate.
- Static Stop Coverage.
- Trailing Stop Coverage.
- Absolute/Max-loss Stop Coverage.
- Immediate Stop Exit Regression.

### Contract & Observability

- Stop Event Metadata Completeness.
- Correlation Continuity on Stop Events.
- State Audit Coverage for `PositionClosed`/`quantity=0`.
- Structured Error Completeness.
- Stop Event Drop-safe Ratio.

### Performance

- Stop Trigger Latency Overhead.
- Execution Ack Latency on Stop Path.

### Engineering Quality

- Build/Static Check Profile Stability.
- Change Budget Compliance.
- Regression count sau rerun.

### Governance

- Artifact consistency.
- Evidence completeness.
- Ownership SLA (P1 unowned = 0).

---

## 8) Assumptions & defaults

- W06 là implementation-focused cho Stop-loss coherence, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.

---

## 9) Execution artifacts (Week 6)

- [week6/KPI_CHARTER_WEEK6.md](week6/KPI_CHARTER_WEEK6.md)
- [week6/STOP_LOSS_BASELINE_REPORT.md](week6/STOP_LOSS_BASELINE_REPORT.md)
- [week6/STOP_LOSS_IMPLEMENTATION_PLAN.md](week6/STOP_LOSS_IMPLEMENTATION_PLAN.md)
- [week6/ISSUE_REGISTER_WEEK6.md](week6/ISSUE_REGISTER_WEEK6.md)
- [week6/INTERFACE_STOP_LOSS_SPEC.md](week6/INTERFACE_STOP_LOSS_SPEC.md)
- [week6/GATE_REHEARSAL_NOTES.md](week6/GATE_REHEARSAL_NOTES.md)
- [week6/WEEK6_FINAL_REPORT_AND_WEEK7_START_PACK.md](week6/WEEK6_FINAL_REPORT_AND_WEEK7_START_PACK.md)

---

## 10) Execution Closeout (Captured)

### Gate verdict

- Final verdict: `GO`.
- Evidence source of truth: [week6/STOP_LOSS_BASELINE_REPORT.md](week6/STOP_LOSS_BASELINE_REPORT.md).
- Gate reconciliation source: [week6/GATE_REHEARSAL_NOTES.md](week6/GATE_REHEARSAL_NOTES.md), [week6/ISSUE_REGISTER_WEEK6.md](week6/ISSUE_REGISTER_WEEK6.md), [week6/WEEK6_FINAL_REPORT_AND_WEEK7_START_PACK.md](week6/WEEK6_FINAL_REPORT_AND_WEEK7_START_PACK.md).

### Captured evidence highlights

| Area | Result | Evidence ID |
|---|---|---|
| Clean-slate preflight | Python cache cleanup + Rust package clean pass | `EV-W6-001`,`EV-W6-002` |
| Python stop regression | `5 passed` | `EV-W6-101` |
| Python critical path | backtest signal flow `9 passed`; observability `8 passed` | `EV-W6-102`,`EV-W6-103` |
| Rust risk/execution | risk-manager + execution-engine/risk-manager suites pass | `EV-W6-104`,`EV-W6-105` |
| Workspace check | `cargo check --workspace` exits `0` with existing warnings only | `EV-W6-106` |
| Runtime/audit | health check pass; compliance pass; correlation audit `0 findings` | `EV-W6-107..109` |
| Parity harness | 6/6 scenarios pass; `0 drift findings`; `correlation_id` preserved | `EV-W6-110`,`EV-W6-201..216`,`EV-W6-301`,`EV-W6-307` |
| Stale cleanup | stop state removed on `quantity=0`; LimitChecker position update pass | `EV-W6-211`,`EV-W6-216`,`EV-W6-303`,`EV-W6-308` |
| Duplicate guard | deterministic stop order id replay test pass | `EV-W6-209`,`EV-W6-302` |
| Governance | artifacts reconciled to one verdict | `EV-W6-304` |

### Residual watch items

- Existing workspace warnings remain in non-W06-critical modules (`market-data`, `signal-bridge`, `execution-engine/slippage`). They are recorded as watch items, not W06 gate blockers.
- Change budget file-count exceeded; `ESC-W6-001` accepted because W06 required the parity helper, Rust helper, PLAYBOOK sync and artifact reconciliation. Net LOC remains under budget.
