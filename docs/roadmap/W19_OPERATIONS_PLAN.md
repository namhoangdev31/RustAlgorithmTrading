# Kế Hoạch Vận Hành Tuần 19 (W19, Safety Guardrails)

## 1) Mục tiêu tuần

W19 tập trung triển khai **Safety Guardrails** theo roadmap 24 tuần:

1. Vận hành kill-switch và risk-off playbook theo chuẩn evidence-first.
2. Khóa response path trong ngưỡng mục tiêu trước khi mở W20 Canary Launch (hẹp).
3. Bảo đảm safety orchestration không tạo regression cho W09-W18.
4. Chốt gate W19 bằng evidence thật với một verdict duy nhất.

Ràng buộc W19:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W19-###`.
- One-ID policy giữ nguyên: chỉ dùng `correlation_id`.
- W19 không mở refactor lan rộng; chỉ hardening safety-critical path.
- W19 không chốt `GO` nếu kill-switch/risk-off evidence còn thiếu mandatory items.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W19) |
|---|---|
| Change Budget (W17-W20) | `<= 25 files` và `<= 1200 LOC net` |
| Compile/Static/Lint/Type | `100% pass` |
| Smoke critical path | `>= 95% pass` |
| Kill-switch response | `<= 60s` |
| Risk-off activation latency | `<= 60s` |
| Risk-off policy correctness | `100%` mandatory scenarios |
| Rollback rehearsal success | `100%` |
| Risk boundary breach (unmitigated) | `0` |
| Correlation coverage critical events | `>= 99%` |
| Alert false-positive sample | `<= 15%` |
| Alert false-negative critical | `= 0` |
| W09-W18 regression guard pass rate | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |
| Artifact consistency | `100%` |

---

## 2) Task board theo chu kỳ (W19-T01 -> W19-T18)

### Pha 1: Freeze scope & safety taxonomy

- `W19-T01` Freeze phạm vi W19: kill-switch, risk-off playbook, safety governance.
- `W19-T02` Freeze taxonomy: safety trigger classes, risk-off dispositions, recovery classes.
- `W19-T03` Freeze acceptance thresholds cho safety response/recovery.
- `W19-T03A` Freeze no-broad-refactor rule: chỉ hardening safety path.

### Pha 2: Baseline capture

- `W19-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W19-T05` Chạy command profile safety-focused, cập nhật matrix `expected/actual`.
- `W19-T06` Capture gaps: kill-switch delay, risk-off inconsistency, ownership gaps.

### Pha 3: Safety guardrails rollout

- `W19-T07` Lane 1: kill-switch response hardening + latency capture.
- `W19-T08` Lane 2: risk-off playbook hardening + deterministic outcome capture.
- `W19-T09` Lane 3: rollback drills và safety-recovery consistency capture.

### Pha 4: Resilience triage & governance closure

- `W19-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W19-T11` Fault-injection rehearsal trong safety scope.
- `W19-T12` Governance rehearsal: trigger -> risk-off -> rollback -> confirm.

### Pha 5: Closure + rerun

- `W19-T13` Rerun baseline sau hardening để xác nhận không regression W09-W18.
- `W19-T14` Khóa issue register theo evidence thật, đóng P0/P1 gate-blocking.

### Pha 6: Gate rehearsal

- `W19-T15` Đồng bộ Baseline -> Issue Register -> KPI -> Gate Notes -> Final Report.
- `W19-T16` Rehearsal verdict `GO/NO-GO` theo phase-5 thresholds.

### Pha 7: Final closeout

- `W19-T17` Xuất final report W19 với một trạng thái gate duy nhất.
- `W19-T18` Chốt Week 20 start pack (Canary Launch guardrails + rollback boundaries).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- Safety rows phải có expected + actual + evidence_id.
- Trigger drills phải có timing capture + rollback outcome.
- Artifact reconciliation phải có source-of-truth và một verdict duy nhất.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc đã chạy.
- Kill-switch response `<=60s`.
- Risk-off playbook mandatory scenarios pass `100%`.
- Rollback rehearsal success `100%`.
- Risk boundary breach unmitigated = `0`.
- W09-W18 regression guard pass.
- Không còn P0 open, không có P1 unowned.
- Artifact consistency `100%`.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W19

### P0

| ID | Issue | Tác động | Điều kiện đóng W19 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W19-ISS-001` | Kill-switch response vượt ngưỡng | Safety response chậm | response `<=60s` | `ops` | `Pha 3` |
| `W19-ISS-002` | Risk-off playbook không deterministic | Safety path không tin cậy | mandatory scenarios pass | `tester` | `Pha 3` |
| `W19-ISS-003` | Rollback safety flow fail | Không đảm bảo recoverability | rollback rehearsal success `100%` | `coder` | `Pha 3` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W19 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W19-ISS-004` | Triage thiếu owner/ETA | Ops closure chậm | triage completeness `100%` | `planner` | `Pha 4` |
| `W19-ISS-005` | Risk boundary mapping chưa khóa | Acceptance mơ hồ | boundary mapping finalized | `planner` | `Pha 4` |
| `W19-ISS-006` | Fault-injection coverage thiếu | Hidden failure modes | scenario matrix complete | `tester` | `Pha 4` |
| `W19-ISS-007` | Correlation coverage dưới ngưỡng | Audit/debug yếu | coverage `>=99%` | `tester` | `Pha 4` |
| `W19-ISS-008` | W09-W18 regression chưa rerun | Regression risk tích lũy | regression guard pass `100%` | `tester` | `Pha 5` |
| `W19-ISS-009` | Gate artifacts mâu thuẫn verdict | Governance fail | one final verdict across artifacts | `planner` | `Pha 6` |
| `W19-ISS-010` | Week 20 handoff thiếu priorities | W20 kickoff mơ hồ | start pack complete | `planner` | `Pha 7` |
| `W19-ISS-011` | Change budget vượt ngưỡng không escalation | Tăng regression risk | escalation record hợp lệ | `planner` | `Pha 5` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W19 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W19-ISS-012` | Safety toil/throughput chưa đo | Ops capacity khó dự báo | throughput watermark captured | `ops` | `Pha 5` |
| `W19-ISS-013` | Evidence linkage thiếu trigger->risk-off->rollback->gate | Audit chậm | linkage complete | `planner` | `Pha 6` |

---

## 5) Test plan W19 (safety-guardrails-focused)

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

1. Kill-switch response đạt `<=60s`.
2. Risk-off playbook mandatory scenarios pass `100%`.
3. Rollback drills pass `100%`.
4. Risk boundary breach unmitigated = `0`.
5. Correlation/compliance audits pass (`0 findings`).
6. Regression guard W09-W18 pass sau W19 rollout.
7. Artifact consistency rehearsal pass.
8. Week 20 start pack completeness pass.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W19)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W19: `EV-W19-###`
- Interface/type change (nếu có) bắt buộc có `CR-W19-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W19-T01..W19-T18`.
4. Issue Register snapshot.
5. Rehearsal results (kill-switch, risk-off, rollback, governance, regression).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 20 Start Pack.

---

## 7) KPI dictionary W19

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- P1 Unowned Count.
- W09-W18 Regression Guard Pass Rate.

### Safety Guardrails

- Kill-switch Response Time.
- Risk-off Playbook Pass Rate.
- Rollback Rehearsal Success Rate.
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

- W19 là implementation-focused cho safety guardrails, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.
- Nếu cần đổi API/alert schema để phục vụ safety guardrails, phải mở `CR-W19-001`; ưu tiên adapter/compatibility trước.

---

## 9) Execution artifacts (Week 19)

- [week19/KPI_CHARTER_WEEK19.md](week19/KPI_CHARTER_WEEK19.md)
- [week19/SAFETY_GUARDRAILS_BASELINE_REPORT.md](week19/SAFETY_GUARDRAILS_BASELINE_REPORT.md)
- [week19/SAFETY_GUARDRAILS_IMPLEMENTATION_PLAN.md](week19/SAFETY_GUARDRAILS_IMPLEMENTATION_PLAN.md)
- [week19/ISSUE_REGISTER_WEEK19.md](week19/ISSUE_REGISTER_WEEK19.md)
- [week19/INTERFACE_SAFETY_GUARDRAILS_SPEC.md](week19/INTERFACE_SAFETY_GUARDRAILS_SPEC.md)
- [week19/GATE_REHEARSAL_NOTES.md](week19/GATE_REHEARSAL_NOTES.md)
- [week19/WEEK19_FINAL_REPORT_AND_WEEK20_START_PACK.md](week19/WEEK19_FINAL_REPORT_AND_WEEK20_START_PACK.md)

---

## 10) Execution status (initial)

- `W19-T01..T18`: `PENDING_EXECUTION`.
- Command profile: `PENDING_EXECUTION`.
- Scenario/hardening matrix: `PENDING_EXECUTION`.
- Final gate: `PENDING_DECISION` cho đến khi đủ evidence thật.
