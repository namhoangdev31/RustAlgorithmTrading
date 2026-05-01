# Kế Hoạch Vận Hành Tuần 17 (W17, Staging Hardening)

## 1) Mục tiêu tuần

W17 tập trung triển khai **Staging Hardening** theo roadmap 24 tuần:

1. Khóa chất lượng staging qua soak run, resilience rehearsal và ops hardening.
2. Đảm bảo incident/recovery path hoạt động ổn định dưới tải kéo dài.
3. Chuẩn hóa staging guardrails trước khi mở W18 Canary Design.
4. Chốt gate W17 bằng evidence thật với một verdict duy nhất.

Ràng buộc W17:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W17-###`.
- One-ID policy giữ nguyên: chỉ dùng `correlation_id`.
- W17 không đổi trading decision path ngoài phạm vi hardening/recovery-critical.
- W17 không chốt `GO` nếu soak/recovery evidence còn thiếu mandatory items.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W17) |
|---|---|
| Change Budget (W17-W20) | `<= 25 files` và `<= 1200 LOC net` |
| Compile/Static/Lint/Type | `100% pass` |
| Smoke critical path | `>= 95% pass` |
| Soak run gate | không có P0/P1 mới phát sinh |
| Kill-switch response | `<= 60s` |
| Rollback rehearsal success | `100%` |
| Correlation coverage critical events | `>= 99%` |
| Alert false-positive sample | `<= 15%` |
| Alert false-negative critical | `= 0` |
| W09-W16 regression guard pass rate | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |
| Artifact consistency | `100%` |

---

## 2) Task board theo chu kỳ (W17-T01 -> W17-T18)

### Pha 1: Freeze scope & staging taxonomy

- `W17-T01` Freeze phạm vi W17: soak test, recovery flow, ops hardening, regression guard.
- `W17-T02` Freeze taxonomy: staging incident classes, degradation levels, rollback outcomes.
- `W17-T03` Freeze gate thresholds cho soak/kill-switch/rollback.
- `W17-T03A` Freeze no-broad-refactor rule: chỉ hardening integration-critical path.

### Pha 2: Baseline capture

- `W17-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W17-T05` Chạy command profile staging-focused, cập nhật matrix `expected/actual`.
- `W17-T06` Capture gaps: soak instability, alert drift, recovery inconsistency, ownership gaps.

### Pha 3: Staging hardening rollout

- `W17-T07` Lane 1: soak run hardening + runtime stability capture.
- `W17-T08` Lane 2: incident/recovery flow hardening + kill-switch timing capture.
- `W17-T09` Lane 3: rollback rehearsal hardening + reproducibility of recovery outcomes.

### Pha 4: Resilience triage & ops closure

- `W17-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W17-T11` Fault-injection rehearsal trong staging scope (không đổi production behavior).
- `W17-T12` Ops handoff rehearsal: incident -> mitigation -> rollback -> confirm.

### Pha 5: Closure + rerun

- `W17-T13` Rerun baseline sau hardening để xác nhận không regression W09-W16.
- `W17-T14` Khóa issue register theo evidence thật, đóng P0/P1 gate-blocking.

### Pha 6: Gate rehearsal

- `W17-T15` Đồng bộ Baseline -> Issue Register -> KPI -> Gate Notes -> Final Report.
- `W17-T16` Rehearsal verdict `GO/NO-GO` theo phase-5 thresholds.

### Pha 7: Final closeout

- `W17-T17` Xuất final report W17 với một trạng thái gate duy nhất.
- `W17-T18` Chốt Week 18 start pack (Canary Design priorities + rollback guardrails).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- Soak/recovery rows phải có expected + actual + evidence_id.
- Incident rehearsal phải có result logs và rollback outcome.
- Artifact reconciliation phải có source-of-truth và một verdict duy nhất.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc đã chạy.
- Soak run mandatory scenarios có evidence thật.
- Kill-switch response `<=60s` hoặc có blocker rõ ràng.
- Rollback rehearsal success `100%`.
- W09-W16 regression guard pass.
- Không còn P0 open, không có P1 unowned.
- Artifact consistency `100%`.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W17

### P0

| ID | Issue | Tác động | Điều kiện đóng W17 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W17-ISS-001` | Soak run fail hoặc sập critical path | Staging không đủ ổn định | soak mandatory scenarios pass | `tester` | `Pha 3` |
| `W17-ISS-002` | Kill-switch response vượt ngưỡng | Safety response không đạt | response `<=60s` | `ops` | `Pha 3` |
| `W17-ISS-003` | Rollback rehearsal fail | Không đảm bảo recoverability | rollback rehearsal success `100%` | `coder` | `Pha 3` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W17 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W17-ISS-004` | Incident triage thiếu owner/ETA | Ops xử lý chậm | triage completeness `100%` | `planner` | `Pha 4` |
| `W17-ISS-005` | Alert profile lệch ngưỡng trong soak | Alert fatigue/miss risk | alert quality trong ngưỡng | `ops` | `Pha 4` |
| `W17-ISS-006` | Recovery sequence không nhất quán | Rehearsal không tái lập | recovery consistency pass | `tester` | `Pha 4` |
| `W17-ISS-007` | W09-W16 regression chưa rerun sau hardening | Regression risk tích lũy | regression guard pass `100%` | `tester` | `Pha 5` |
| `W17-ISS-008` | Gate artifacts mâu thuẫn trạng thái | Governance fail | one final verdict across artifacts | `planner` | `Pha 6` |
| `W17-ISS-009` | Week 18 handoff thiếu canary priorities | W18 kickoff mơ hồ | start pack complete | `planner` | `Pha 7` |
| `W17-ISS-010` | Change budget vượt ngưỡng không escalation | Tăng regression risk | escalation record hợp lệ | `planner` | `Pha 5` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W17 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W17-ISS-011` | Soak throughput/toil chưa đo | Ops capacity khó dự báo | throughput watermark captured | `ops` | `Pha 5` |
| `W17-ISS-012` | Evidence linkage thiếu incident->recovery->rollback->gate | Audit tốn thời gian | linkage complete | `planner` | `Pha 6` |

---

## 5) Test plan W17 (staging-hardening-focused)

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

1. Soak run không phát sinh P0/P1 mới gate-blocking.
2. Kill-switch response đạt `<=60s`.
3. Rollback rehearsal success `100%`.
4. Incident->mitigation->rollback flow traceable đầy đủ.
5. Correlation/compliance audits pass (`0 findings`).
6. Regression guard W09-W16 pass sau W17 rollout.
7. Artifact consistency rehearsal pass.
8. Week 18 start pack completeness pass.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W17)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W17: `EV-W17-###`
- Interface/type change (nếu có) bắt buộc có `CR-W17-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W17-T01..W17-T18`.
4. Issue Register snapshot.
5. Rehearsal results (soak, kill-switch, rollback, governance, regression).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 18 Start Pack.

---

## 7) KPI dictionary W17

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- P1 Unowned Count.
- W09-W16 Regression Guard Pass Rate.

### Staging Hardening

- Soak Run Stability Pass Rate.
- Kill-switch Response Time.
- Rollback Rehearsal Success Rate.
- Recovery Sequence Consistency.

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

- W17 là implementation-focused cho staging hardening, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.
- Nếu cần đổi API/alert schema để phục vụ hardening, phải mở `CR-W17-001`; ưu tiên adapter/compatibility trước.

---

## 9) Execution artifacts (Week 17)

- [week17/KPI_CHARTER_WEEK17.md](week17/KPI_CHARTER_WEEK17.md)
- [week17/STAGING_HARDENING_BASELINE_REPORT.md](week17/STAGING_HARDENING_BASELINE_REPORT.md)
- [week17/STAGING_HARDENING_IMPLEMENTATION_PLAN.md](week17/STAGING_HARDENING_IMPLEMENTATION_PLAN.md)
- [week17/ISSUE_REGISTER_WEEK17.md](week17/ISSUE_REGISTER_WEEK17.md)
- [week17/INTERFACE_STAGING_HARDENING_SPEC.md](week17/INTERFACE_STAGING_HARDENING_SPEC.md)
- [week17/GATE_REHEARSAL_NOTES.md](week17/GATE_REHEARSAL_NOTES.md)
- [week17/WEEK17_FINAL_REPORT_AND_WEEK18_START_PACK.md](week17/WEEK17_FINAL_REPORT_AND_WEEK18_START_PACK.md)

---

## 10) Execution status (initial)

- `W17-T01..T18`: `PENDING_EXECUTION`.
- Command profile: `PENDING_EXECUTION`.
- Scenario/hardening matrix: `PENDING_EXECUTION`.
- Final gate: `PENDING_DECISION` cho đến khi đủ evidence thật.
