# Kế Hoạch Vận Hành Tuần 20 (W20, Canary Launch Hẹp)

## 1) Mục tiêu tuần

W20 tập trung triển khai **Canary Launch (hẹp)** theo roadmap 24 tuần:

1. Vận hành controlled canary execution trong risk boundary đã khóa.
2. Kiểm chứng launch guardrails: kill-switch, rollback, incident escalation.
3. Chốt canary-closeout readiness để mở W21 hard-gates full-suite.
4. Chốt gate W20 bằng evidence thật với một verdict duy nhất.

Ràng buộc W20:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W20-###`.
- One-ID policy giữ nguyên: chỉ dùng `correlation_id`.
- W20 không mở rộng canary ngoài phạm vi hẹp đã approve.
- W20 không chốt `GO` nếu canary/risk-boundary evidence còn thiếu mandatory items.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W20) |
|---|---|
| Change Budget (W17-W20) | `<= 25 files` và `<= 1200 LOC net` |
| Compile/Static/Lint/Type | `100% pass` |
| Smoke critical path | `>= 95% pass` |
| Canary launch scenario coverage | `100%` mandatory scenarios |
| Risk boundary breach (unmitigated) | `0` |
| Kill-switch response | `<= 60s` |
| Rollback rehearsal success | `100%` |
| Incident escalation correctness | `100%` mandatory scenarios |
| Correlation coverage critical events | `>= 99%` |
| Alert false-positive sample | `<= 15%` |
| Alert false-negative critical | `= 0` |
| W09-W19 regression guard pass rate | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |
| Artifact consistency | `100%` |

---

## 2) Task board theo chu kỳ (W20-T01 -> W20-T18)

### Pha 1: Freeze scope & canary-launch taxonomy

- `W20-T01` Freeze phạm vi W20: controlled canary execution, boundary checks, rollback safety.
- `W20-T02` Freeze taxonomy: launch lanes, breach classes, escalation states.
- `W20-T03` Freeze acceptance thresholds cho canary launch.
- `W20-T03A` Freeze no-broad-refactor rule: chỉ hardening canary-launch path.

### Pha 2: Baseline capture

- `W20-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W20-T05` Chạy command profile canary-launch-focused, cập nhật matrix `expected/actual`.
- `W20-T06` Capture gaps: boundary drift, rollback instability, escalation inconsistency.

### Pha 3: Canary launch rollout

- `W20-T07` Lane 1: controlled launch scenario rollout + coverage capture.
- `W20-T08` Lane 2: risk boundary monitoring + breach handling rehearsal.
- `W20-T09` Lane 3: kill-switch + rollback drills trong launch context.

### Pha 4: Hardening triage & governance closure

- `W20-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W20-T11` Fault-injection rehearsal trong canary launch scope.
- `W20-T12` Governance rehearsal: launch -> breach -> escalation -> rollback -> confirm.

### Pha 5: Closure + rerun

- `W20-T13` Rerun baseline sau hardening để xác nhận không regression W09-W19.
- `W20-T14` Khóa issue register theo evidence thật, đóng P0/P1 gate-blocking.

### Pha 6: Gate rehearsal

- `W20-T15` Đồng bộ Baseline -> Issue Register -> KPI -> Gate Notes -> Final Report.
- `W20-T16` Rehearsal verdict `GO/NO-GO` theo phase-5 thresholds.

### Pha 7: Final closeout

- `W20-T17` Xuất final report W20 với một trạng thái gate duy nhất.
- `W20-T18` Chốt Week 21 start pack (full-suite hard-gate sequence + release blockers policy).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- Canary launch rows phải có expected + actual + evidence_id.
- Launch breach drills phải có escalation trace + rollback outcome.
- Artifact reconciliation phải có source-of-truth và một verdict duy nhất.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc đã chạy.
- Controlled canary launch mandatory scenarios pass `100%`.
- Risk boundary breach unmitigated = `0`.
- Kill-switch response `<=60s`.
- Rollback rehearsal success `100%`.
- Incident escalation correctness `100%`.
- W09-W19 regression guard pass.
- Không còn P0 open, không có P1 unowned.
- Artifact consistency `100%`.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W20

### P0

| ID | Issue | Tác động | Điều kiện đóng W20 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W20-ISS-001` | Canary launch breach risk boundary | Safety vi phạm | unmitigated breach `=0` | `ops` | `Pha 3` |
| `W20-ISS-002` | Kill-switch/rollback fail trong launch path | Không đảm bảo recoverability | kill-switch/rollback mandatory pass | `coder` | `Pha 3` |
| `W20-ISS-003` | Incident escalation sai state | Ops xử lý sai nhịp | escalation scenarios pass `100%` | `tester` | `Pha 3` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W20 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W20-ISS-004` | Launch scenario coverage thiếu | Gate coverage không đủ | mandatory coverage `100%` | `tester` | `Pha 4` |
| `W20-ISS-005` | Boundary monitoring drift | Phát hiện breach không nhất quán | boundary monitor consistency pass | `ops` | `Pha 4` |
| `W20-ISS-006` | Fault-injection thiếu coverage | Hidden failure modes | scenario matrix complete | `tester` | `Pha 4` |
| `W20-ISS-007` | Correlation coverage dưới ngưỡng | Audit/debug yếu | coverage `>=99%` | `tester` | `Pha 4` |
| `W20-ISS-008` | W09-W19 regression chưa rerun | Regression risk tích lũy | regression guard pass `100%` | `tester` | `Pha 5` |
| `W20-ISS-009` | Gate artifacts mâu thuẫn verdict | Governance fail | one final verdict across artifacts | `planner` | `Pha 6` |
| `W20-ISS-010` | Week 21 handoff thiếu hard-gate priorities | W21 kickoff mơ hồ | start pack complete | `planner` | `Pha 7` |
| `W20-ISS-011` | Change budget vượt ngưỡng không escalation | Tăng regression risk | escalation record hợp lệ | `planner` | `Pha 5` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W20 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W20-ISS-012` | Canary launch toil/throughput chưa đo | Ops capacity khó dự báo | throughput watermark captured | `ops` | `Pha 5` |
| `W20-ISS-013` | Evidence linkage thiếu launch->boundary->escalation->rollback->gate | Audit chậm | linkage complete | `planner` | `Pha 6` |

---

## 5) Test plan W20 (canary-launch-focused)

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

1. Controlled canary launch mandatory scenarios pass `100%`.
2. Risk boundary breach unmitigated = `0`.
3. Kill-switch response đạt `<=60s`.
4. Rollback drills pass `100%`.
5. Incident escalation correctness pass `100%`.
6. Correlation/compliance audits pass (`0 findings`).
7. Regression guard W09-W19 pass sau W20 rollout.
8. Artifact consistency rehearsal pass.
9. Week 21 start pack completeness pass.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W20)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W20: `EV-W20-###`
- Interface/type change (nếu có) bắt buộc có `CR-W20-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W20-T01..W20-T18`.
4. Issue Register snapshot.
5. Rehearsal results (launch boundary, escalation, rollback, governance, regression).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 21 Start Pack.

---

## 7) KPI dictionary W20

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- P1 Unowned Count.
- W09-W19 Regression Guard Pass Rate.

### Canary Launch

- Controlled Canary Coverage.
- Risk Boundary Breach Count (Unmitigated).
- Kill-switch Response Time.
- Rollback Rehearsal Success Rate.
- Incident Escalation Correctness.

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

- W20 là implementation-focused cho canary launch (hẹp), không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.
- Nếu cần đổi API/alert schema để phục vụ canary launch, phải mở `CR-W20-001`; ưu tiên adapter/compatibility trước.

---

## 9) Execution artifacts (Week 20)

- [week20/KPI_CHARTER_WEEK20.md](week20/KPI_CHARTER_WEEK20.md)
- [week20/CANARY_LAUNCH_BASELINE_REPORT.md](week20/CANARY_LAUNCH_BASELINE_REPORT.md)
- [week20/CANARY_LAUNCH_IMPLEMENTATION_PLAN.md](week20/CANARY_LAUNCH_IMPLEMENTATION_PLAN.md)
- [week20/ISSUE_REGISTER_WEEK20.md](week20/ISSUE_REGISTER_WEEK20.md)
- [week20/INTERFACE_CANARY_LAUNCH_SPEC.md](week20/INTERFACE_CANARY_LAUNCH_SPEC.md)
- [week20/GATE_REHEARSAL_NOTES.md](week20/GATE_REHEARSAL_NOTES.md)
- [week20/WEEK20_FINAL_REPORT_AND_WEEK21_START_PACK.md](week20/WEEK20_FINAL_REPORT_AND_WEEK21_START_PACK.md)

---

## 10) Execution status (initial)

- `W20-T01..T18`: `PENDING_EXECUTION`.
- Command profile: `PENDING_EXECUTION`.
- Scenario/hardening matrix: `PENDING_EXECUTION`.
- Final gate: `PENDING_DECISION` cho đến khi đủ evidence thật.
