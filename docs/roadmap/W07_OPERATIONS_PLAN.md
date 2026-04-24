# Kế Hoạch Vận Hành Tuần 7 (W07, Circuit Breaker Hardening)

## 1) Mục tiêu tuần

W07 tập trung triển khai **Circuit Breaker Hardening** theo roadmap 24 tuần:

1. Khóa behavior circuit breaker thành safety path ổn định: trip đúng trigger, recover đúng cooldown, không loop-trip.
2. Đồng bộ circuit breaker với Risk Limits v1 (W05), Stop-loss Coherence (W06), Execution reject path và Observability.
3. Đảm bảo khi circuit breaker `OPEN`, lệnh mới bị reject/drop-safe trước execution; khi recovery đủ điều kiện thì `HALF_OPEN -> CLOSED` có kiểm soát.
4. Chốt gate W07 bằng evidence thật để mở W08 (Execution retry/slippage) mà không để rủi ro duplicate/retry chồng lên circuit breaker.
5. Không mở refactor lan rộng; chỉ chỉnh circuit breaker/risk/execution/observability critical path khi có evidence P0/P1.

Ràng buộc W07:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W07-###`.
- Ưu tiên adapter/hardening nội bộ, giữ 90-100% codebase hiện hữu.
- One-ID policy giữ nguyên: chỉ dùng `correlation_id` trong public docs/log/event.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W07) |
|---|---|
| Change Budget (W05-W08) | `<= 15 files` và `<= 800 LOC net` |
| Compile/Static/Lint/Type | `100% pass` |
| Smoke critical path | `>= 95% pass` |
| Duplicate order/risk-side-effect rate | `<= 0.1%` |
| Risk breach mới do thay đổi W07 | `= 0` |
| Circuit breaker trip correctness | `100%` mandatory scenarios |
| Circuit breaker recovery correctness | `100%` cooldown/half-open scenarios |
| Loop-trip count trong stress scenario | `= 0` |
| False reset trước cooldown | `= 0` |
| Circuit breaker event correlation continuity | `100%` |
| Circuit breaker status metric/log completeness | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |

---

## 2) Task board theo chu kỳ (W7-T01 -> W7-T18)

### Pha 1: Freeze scope & circuit breaker semantics

- `W7-T01` Freeze phạm vi Circuit Breaker Hardening: Rust risk-manager, execution reject path, metrics/logging, runbook drill.
- `W7-T02` Freeze state machine dictionary: `CLOSED`, `OPEN`, `HALF_OPEN`, `RESET_PENDING`, `DISABLED` nếu codebase cần compatibility state.
- `W7-T03` Freeze trip/recover/cooldown policy, evidence taxonomy và issue ownership W07.
- `W7-T03A` Freeze interaction rules với W05 risk limits và W06 stop-loss: circuit breaker không rewrite stop state và không tạo execution side-effect.

### Pha 2: Baseline capture

- `W7-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W7-T05` Chạy command profile circuit-breaker-focused, cập nhật matrix `expected/actual`.
- `W7-T06` Chốt baseline cho circuit breaker current behavior, risk rejection, execution side-effect và observability path.

### Pha 3: Implementation rollout

- `W7-T07` Lane 1: harden Rust circuit breaker state machine (`CLOSED -> OPEN -> HALF_OPEN -> CLOSED/OPEN`).
- `W7-T08` Lane 2: harden trip triggers: daily loss, manual/emergency trip, repeated risk failure nếu codebase có signal.
- `W7-T09` Lane 3: harden execution guard: khi breaker `OPEN`, order mới reject trước execution, không duplicate side-effect.

### Pha 4: Triage & resilience hardening

- `W7-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W7-T11` Hardening cooldown/recovery: không reset sớm, `HALF_OPEN` chỉ cho phép probe có kiểm soát, recovery fail quay lại `OPEN`.
- `W7-T12` Chạy stress scenario để chứng minh không loop-trip, không flapping, không bypass risk-off.

### Pha 5: Closure + rerun

- `W7-T13` Rerun baseline sau rollout để xác nhận không regression W05/W06.
- `W7-T14` Khóa issue register theo evidence thật, đóng P0/P1 gate-blocking.

### Pha 6: Gate rehearsal

- `W7-T15` Đồng bộ Baseline -> Issue Register -> Gate Notes -> Final Report.
- `W7-T16` Rehearsal quyết định `GO/NO-GO` theo rule Phase 2.

### Pha 7: Final closeout

- `W7-T17` Xuất final report W07 với một trạng thái gate duy nhất.
- `W7-T18` Chốt Week 8 start pack (execution retry/slippage priorities + circuit breaker guardrails).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- Circuit breaker event luôn có `correlation_id`, state, reason_code, disposition trong evidence.
- State transition matrix được cập nhật tiến độ mỗi ngày.
- Cooldown/recovery behavior phải ghi rõ: pass, fail, hoặc `BLOCKED_ENV`.
- Execution side-effect risk được kiểm tra sau mỗi lane.
- Decision log cuối chu kỳ phản ánh đúng trạng thái runtime.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc đã chạy.
- Circuit breaker transition matrix = `100%` mandatory scenarios.
- Stress scenario loop-trip count = `0`.
- Duplicate order/risk-side-effect rate `<= 0.1%`.
- False reset trước cooldown = `0`.
- Correlation continuity = `100%`.
- Không còn P0 open, không có P1 unowned.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W07

### P0

| ID | Issue | Tác động | Điều kiện đóng W07 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W7-ISS-001` | Circuit breaker state machine quá đơn giản hoặc thiếu `HALF_OPEN/cooldown` | Có thể reset sai/bypass risk-off | Transition matrix `CAPTURED_PASS` | `coder` | `Pha 3` |
| `W7-ISS-002` | Order vẫn đi vào execution khi breaker `OPEN` | Rủi ro live-loss trực tiếp | open-state reject trước execution pass | `coder` | `Pha 3` |
| `W7-ISS-003` | Loop-trip/flapping trong stress scenario | Trading halt/resume bất ổn | loop-trip count `=0` | `tester` | `Pha 4` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W07 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W7-ISS-004` | Cooldown/reset policy chưa rõ | False reset hoặc downtime kéo dài | cooldown/recover scenarios pass | `coder` | `Pha 4` |
| `W7-ISS-005` | Circuit breaker observability thiếu context | Khó triage incident P0 | event/log/metric có `correlation_id`, state, reason | `ops` | `Pha 4` |
| `W7-ISS-006` | Manual reset thiếu guardrail/approval evidence | Reset sai khi chưa xử lý root cause | reset drill + runbook evidence pass | `ops` | `Pha 5` |
| `W7-ISS-007` | Risk limits/stop-loss interaction chưa được regression | Regression W05/W06 | W05/W06 guardrail slices pass sau W07 | `tester` | `Pha 5` |
| `W7-ISS-008` | Gate artifacts mâu thuẫn trạng thái | Sai governance | Baseline/Issue/Gate/Final cùng 1 quyết định | `planner` | `Pha 6` |
| `W7-ISS-009` | Circuit breaker metrics không scrape/không đủ labels | Dashboard/alert sai | metric audit pass | `ops` | `Pha 4` |
| `W7-ISS-010` | Hot-reload làm thay đổi breaker state đang `OPEN` | Bypass safety state | reload interaction guard pass | `coder` | `Pha 4` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W07 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W7-ISS-011` | Vượt change budget tuần | Tăng regression risk | Có escalation record hợp lệ hoặc giảm scope | `planner` | `Pha 5` |
| `W7-ISS-012` | Circuit breaker latency overhead chưa đo | Giảm hiệu năng critical path | overhead `<=0.2ms` hoặc mitigation rõ | `ops` | `Pha 5` |

---

## 5) Test plan W07 (circuit-breaker-focused)

### Command profile chuẩn

```bash
python -m pytest tests/integration/test_backtest_signal_flow.py -q
python -m pytest tests/integration/test_observability_integration.py -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p risk-manager
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p execution-engine -p risk-manager
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
bash scripts/compliance_audit.sh --check-correlation --check-versioning
python scripts/audit_correlation.py --fail-on-findings
```

### Scenario bắt buộc

1. `CLOSED`: order hợp lệ được allow nếu risk limits pass.
2. Trip trigger: daily loss hoặc manual/emergency trip chuyển breaker sang `OPEN`.
3. `OPEN`: order mới reject trước execution, reason `CIRCUIT_BREAKER_TRIPPED` hoặc token canonical tương đương.
4. Cooldown: breaker không reset trước cooldown.
5. `HALF_OPEN`: chỉ cho phép probe có kiểm soát nếu codebase hỗ trợ; probe fail quay lại `OPEN`.
6. Recovery: probe/recovery pass chuyển `CLOSED` và resume order path có kiểm soát.
7. Stress: repeated trip/recover không loop-trip/flapping.
8. Interaction W05: risk limits reject semantics không bị override sai bởi breaker.
9. Interaction W06: stop-loss state không bị rewrite bởi breaker/hot-reload.
10. Observability: event/log/metric có `correlation_id` + state + reason + disposition.
11. Safety: malformed/manual reset input drop-safe, không panic.
12. Runbook: reset drill có approval/owner/evidence.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W07)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W07: `EV-W7-###`
- Interface/type change (nếu có) bắt buộc có `CR-W07-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W7-T01..W7-T18`.
4. Issue Register snapshot.
5. Rehearsal results (state transition, stress loop-trip, observability, runbook reset drill).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 8 Start Pack.

---

## 7) KPI dictionary W07

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- Circuit Breaker Loop-trip Count.
- False Reset Count.
- Duplicate Order/Risk Side-effect Rate.

### Risk Quality

- State Transition Coverage.
- Trip Trigger Correctness.
- Cooldown Enforcement.
- Recovery Correctness.
- Risk-off Bypass Count.
- W05/W06 Regression Guard Pass Rate.

### Contract & Observability

- Circuit Breaker Event Metadata Completeness.
- Correlation Continuity on Circuit Breaker Events.
- Structured Error Completeness.
- Metric Scrape Completeness.
- Runbook Evidence Completeness.

### Performance

- Circuit Breaker Check Latency Overhead.
- Recovery Probe Latency.

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

- W07 là implementation-focused cho Circuit Breaker Hardening, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.
- Nếu codebase hiện tại chưa có `HALF_OPEN`, W07 được phép thêm state nội bộ nếu có CR hoặc ghi rõ compatibility policy; public envelope vẫn không đổi.

---

## 9) Execution artifacts (Week 7)

- [week7/KPI_CHARTER_WEEK7.md](week7/KPI_CHARTER_WEEK7.md)
- [week7/CIRCUIT_BREAKER_BASELINE_REPORT.md](week7/CIRCUIT_BREAKER_BASELINE_REPORT.md)
- [week7/CIRCUIT_BREAKER_IMPLEMENTATION_PLAN.md](week7/CIRCUIT_BREAKER_IMPLEMENTATION_PLAN.md)
- [week7/ISSUE_REGISTER_WEEK7.md](week7/ISSUE_REGISTER_WEEK7.md)
- [week7/INTERFACE_CIRCUIT_BREAKER_SPEC.md](week7/INTERFACE_CIRCUIT_BREAKER_SPEC.md)
- [week7/GATE_REHEARSAL_NOTES.md](week7/GATE_REHEARSAL_NOTES.md)
- [week7/WEEK7_FINAL_REPORT_AND_WEEK8_START_PACK.md](week7/WEEK7_FINAL_REPORT_AND_WEEK8_START_PACK.md)

---

## 10) Execution status (closeout)

- `W7-T01..T18`: `DONE`.
- Command profile: `CAPTURED_PASS` (`EV-W7-101..108`).
- Scenario/hardening matrix: `CAPTURED_PASS` (`EV-W7-201..215`, `EV-W7-301..306`).
- Change record: `CR-W07-001` captured for internal `validate_order(&mut self, ...)`; public envelope unchanged.
- Final gate: `GO`.
