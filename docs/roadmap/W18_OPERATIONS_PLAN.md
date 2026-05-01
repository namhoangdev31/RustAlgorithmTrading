# Kế Hoạch Vận Hành Tuần 18 (W18, Canary Design)

## 1) Mục tiêu tuần

W18 tập trung triển khai **Canary Design** theo roadmap 24 tuần:

1. Thiết kế và rehearsal canary flow có ràng buộc risk rõ ràng.
2. Chuẩn hóa rollback scenarios cho canary breach cases.
3. Khóa guardrails để mở W19 Safety Guardrails với risk kiểm soát được.
4. Chốt gate W18 bằng evidence thật với một verdict duy nhất.

Ràng buộc W18:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W18-###`.
- One-ID policy giữ nguyên: chỉ dùng `correlation_id`.
- W18 không thực thi live rộng; chỉ rehearsal trong phạm vi canary design.
- W18 không chốt `GO` nếu rollback rehearsal/canary guardrails thiếu evidence mandatory.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W18) |
|---|---|
| Change Budget (W17-W20) | `<= 25 files` và `<= 1200 LOC net` |
| Compile/Static/Lint/Type | `100% pass` |
| Smoke critical path | `>= 95% pass` |
| Canary scenario completeness | `100%` mandatory scenarios |
| Canary rollback rehearsal success | `100%` |
| Risk boundary breach during rehearsal | `0` unmitigated |
| Kill-switch response | `<= 60s` |
| Correlation coverage critical events | `>= 99%` |
| Alert false-positive sample | `<= 15%` |
| Alert false-negative critical | `= 0` |
| W09-W17 regression guard pass rate | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |
| Artifact consistency | `100%` |

---

## 2) Task board theo chu kỳ (W18-T01 -> W18-T18)

### Pha 1: Freeze scope & canary taxonomy

- `W18-T01` Freeze phạm vi W18: canary scenarios, rollback drills, risk guardrails.
- `W18-T02` Freeze canary taxonomy: exposure tiers, trigger classes, rollback dispositions.
- `W18-T03` Freeze acceptance thresholds cho canary/rollback.
- `W18-T03A` Freeze no-broad-refactor rule: chỉ hardening canary-design path.

### Pha 2: Baseline capture

- `W18-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W18-T05` Chạy command profile canary-focused, cập nhật matrix `expected/actual`.
- `W18-T06` Capture gaps: missing canary scenario coverage, rollback instability, risk-boundary ambiguity.

### Pha 3: Canary design rollout

- `W18-T07` Lane 1: canary scenario matrix finalization + ownership lock.
- `W18-T08` Lane 2: rollback scenario drills + timing evidence.
- `W18-T09` Lane 3: kill-switch + canary breach handling rehearsal.

### Pha 4: Resilience triage & governance closure

- `W18-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W18-T11` Fault-injection rehearsal trong canary scope.
- `W18-T12` Governance rehearsal: breach -> rollback -> confirm -> close.

### Pha 5: Closure + rerun

- `W18-T13` Rerun baseline sau hardening để xác nhận không regression W09-W17.
- `W18-T14` Khóa issue register theo evidence thật, đóng P0/P1 gate-blocking.

### Pha 6: Gate rehearsal

- `W18-T15` Đồng bộ Baseline -> Issue Register -> KPI -> Gate Notes -> Final Report.
- `W18-T16` Rehearsal verdict `GO/NO-GO` theo phase-5 thresholds.

### Pha 7: Final closeout

- `W18-T17` Xuất final report W18 với một trạng thái gate duy nhất.
- `W18-T18` Chốt Week 19 start pack (Safety Guardrails priorities + kill-switch playbook guardrails).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- Canary/rollback rows phải có expected + actual + evidence_id.
- Breach drills phải có decision trace và rollback outcome.
- Artifact reconciliation phải có source-of-truth và một verdict duy nhất.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc đã chạy.
- Canary scenario coverage mandatory đạt `100%`.
- Rollback rehearsal success `100%`.
- Kill-switch response `<=60s`.
- Risk boundary breach unmitigated = `0`.
- W09-W17 regression guard pass.
- Không còn P0 open, không có P1 unowned.
- Artifact consistency `100%`.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W18

### P0

| ID | Issue | Tác động | Điều kiện đóng W18 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W18-ISS-001` | Canary scenario coverage thiếu mandatory items | Canary launch risk cao | coverage `100%` mandatory scenarios | `tester` | `Pha 3` |
| `W18-ISS-002` | Rollback rehearsal fail | Không đảm bảo recoverability | rollback rehearsal success `100%` | `coder` | `Pha 3` |
| `W18-ISS-003` | Canary breach handling không deterministic | Safety path không tin cậy | breach handling rehearsal pass | `ops` | `Pha 3` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W18 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W18-ISS-004` | Kill-switch response vượt ngưỡng | Delay risk-off action | response `<=60s` | `ops` | `Pha 4` |
| `W18-ISS-005` | Risk boundary definition drift | Canary acceptance mơ hồ | boundary mapping finalized | `planner` | `Pha 4` |
| `W18-ISS-006` | Fault-injection scenario chưa phủ đủ | Hidden failure modes | scenario matrix complete | `tester` | `Pha 4` |
| `W18-ISS-007` | W09-W17 regression chưa rerun sau hardening | Regression risk tích lũy | regression guard pass `100%` | `tester` | `Pha 5` |
| `W18-ISS-008` | Gate artifacts mâu thuẫn trạng thái | Governance fail | one final verdict across artifacts | `planner` | `Pha 6` |
| `W18-ISS-009` | Week 19 handoff thiếu safety priorities | W19 kickoff mơ hồ | start pack complete | `planner` | `Pha 7` |
| `W18-ISS-010` | Change budget vượt ngưỡng không escalation | Tăng regression risk | escalation record hợp lệ | `planner` | `Pha 5` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W18 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W18-ISS-011` | Canary toil/throughput chưa đo | Ops capacity khó dự báo | throughput watermark captured | `ops` | `Pha 5` |
| `W18-ISS-012` | Evidence linkage thiếu canary->rollback->gate | Audit chậm | linkage complete | `planner` | `Pha 6` |

---

## 5) Test plan W18 (canary-design-focused)

### Command profile chuẩn

```bash
python -m pytest tests/observability -q
python -m pytest tests/integration/test_observability_integration.py -q
python -m pytest tests/integration/test_backtest_signal_flow.py -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p risk-manager -p execution-engine
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
bash scripts/compliance_audit.sh --check-correlation --check-versioning
python scripts/audit_correlation.py --fail-on-findings
```

### Scenario bắt buộc

1. Canary scenario matrix mandatory coverage `100%`.
2. Rollback drills pass `100%`.
3. Kill-switch response đạt `<=60s`.
4. Canary breach handling deterministic và traceable.
5. Risk boundary breach unmitigated = `0`.
6. Correlation/compliance audits pass (`0 findings`).
7. Regression guard W09-W17 pass sau W18 rollout.
8. Artifact consistency rehearsal pass.
9. Week 19 start pack completeness pass.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W18)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W18: `EV-W18-###`
- Interface/type change (nếu có) bắt buộc có `CR-W18-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W18-T01..W18-T18`.
4. Issue Register snapshot.
5. Rehearsal results (canary matrix, rollback drills, kill-switch, governance, regression).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 19 Start Pack.

---

## 7) KPI dictionary W18

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- P1 Unowned Count.
- W09-W17 Regression Guard Pass Rate.

### Canary Design

- Canary Scenario Coverage.
- Canary Breach Handling Pass Rate.
- Rollback Rehearsal Success Rate.
- Kill-switch Response Time.
- Risk Boundary Breach Count (Unmitigated).

### Alert & Observability

- Correlation Coverage.
- Alert False Positive Sample Rate.
- Alert False Negative Critical Count.
- Compliance Findings Count.

### Engineering Quality

- Build/Static Check Profile Stability.
- Change Budget Compliance.
- Regression Count Sau Rerun.

### Governance

- Artifact consistency.
- Evidence completeness.
- Ownership SLA (P1 unowned = 0).

---

## 8) Assumptions & defaults

- W18 là implementation-focused cho canary design, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.
- Nếu cần đổi API/alert schema để phục vụ canary design, phải mở `CR-W18-001`; ưu tiên adapter/compatibility trước.

---

## 9) Execution artifacts (Week 18)

- [week18/KPI_CHARTER_WEEK18.md](week18/KPI_CHARTER_WEEK18.md)
- [week18/CANARY_DESIGN_BASELINE_REPORT.md](week18/CANARY_DESIGN_BASELINE_REPORT.md)
- [week18/CANARY_DESIGN_IMPLEMENTATION_PLAN.md](week18/CANARY_DESIGN_IMPLEMENTATION_PLAN.md)
- [week18/ISSUE_REGISTER_WEEK18.md](week18/ISSUE_REGISTER_WEEK18.md)
- [week18/INTERFACE_CANARY_ROLLBACK_SPEC.md](week18/INTERFACE_CANARY_ROLLBACK_SPEC.md)
- [week18/GATE_REHEARSAL_NOTES.md](week18/GATE_REHEARSAL_NOTES.md)
- [week18/WEEK18_FINAL_REPORT_AND_WEEK19_START_PACK.md](week18/WEEK18_FINAL_REPORT_AND_WEEK19_START_PACK.md)

---

## 10) Execution status (initial)

- `W18-T01..T18`: `PENDING_EXECUTION`.
- Command profile: `PENDING_EXECUTION`.
- Scenario/hardening matrix: `PENDING_EXECUTION`.
- Final gate: `PENDING_DECISION` cho đến khi đủ evidence thật.
