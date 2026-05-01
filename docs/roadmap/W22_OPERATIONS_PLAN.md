# Kế Hoạch Vận Hành Tuần 22 (W22, Final-Phase Gate 2)

## 1) Mục tiêu tuần

W22 tập trung triển khai **Final-Phase Gate 2** theo roadmap 24 tuần:

1. Chạy full Python/Rust unit + integration theo hard-gate rule.
2. Đóng integration debt phát sinh trong tuần.
3. Bảo đảm cross-runtime stability trước W23 e2e/soak/fault-injection.
4. Chốt gate W22 bằng evidence thật với một verdict duy nhất.

Ràng buộc W22:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W22-###`.
- One-ID policy giữ nguyên: chỉ dùng `correlation_id`.
- W22 là hard-gate phase release: không defer test debt sang tuần kế tiếp.
- W22 không chốt `GO` nếu còn bất kỳ required suite fail.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W22) |
|---|---|
| Change Budget (W21-W24) | `<= 15 files` và `<= 700 LOC net` |
| Full Python unit+integration | `100% pass` |
| Full Rust unit+integration | `100% pass` |
| Integration debt mới trong tuần | `0` open tại gate lock |
| Smoke critical path | `>= 95% pass` |
| Correlation coverage critical events | `>= 99%` |
| Compliance findings | `0` |
| W09-W21 regression guard pass rate | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |
| Artifact consistency | `100%` |

---

## 2) Task board theo chu kỳ (W22-T01 -> W22-T18)

### Pha 1: Freeze scope & hard-gate2 taxonomy

- `W22-T01` Freeze phạm vi W22: full Python/Rust unit+integration + debt closure.
- `W22-T02` Freeze taxonomy: integration blockers, cross-runtime failure classes.
- `W22-T03` Freeze acceptance thresholds cho hard-gate2.
- `W22-T03A` Freeze no-broad-refactor rule: chỉ sửa tối thiểu để đóng gate fail thực.

### Pha 2: Baseline capture

- `W22-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W22-T05` Chạy command profile hard-gate2, cập nhật matrix `expected/actual`.
- `W22-T06` Capture gaps: Python/Rust integration failures, debt ownership gaps.

### Pha 3: Hard-gate2 rollout

- `W22-T07` Lane 1: Python unit+integration closure.
- `W22-T08` Lane 2: Rust unit+integration closure.
- `W22-T09` Lane 3: cross-runtime integration debt closure + rerun deterministic.

### Pha 4: Triage & governance closure

- `W22-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W22-T11` Recheck release blockers mapping + escalation logs nếu vượt budget.
- `W22-T12` Compliance/correlation rehearse và khóa findings.

### Pha 5: Closure + rerun

- `W22-T13` Rerun full hard-gate2 profile sau fixes để xác nhận pass liên tục.
- `W22-T14` Khóa issue register theo evidence thật, đóng P0/P1 gate-blocking.

### Pha 6: Gate rehearsal

- `W22-T15` Đồng bộ Baseline -> Issue Register -> KPI -> Gate Notes -> Final Report.
- `W22-T16` Rehearsal verdict `GO/NO-GO` theo phase-6 thresholds.

### Pha 7: Final closeout

- `W22-T17` Xuất final report W22 với một trạng thái gate duy nhất.
- `W22-T18` Chốt Week 23 start pack (cross-runtime/e2e + soak + fault-injection priorities).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- Hard-gate rows phải có expected + actual + evidence_id.
- Suite fail phải có root-cause + owner + rerun plan.
- Artifact reconciliation phải có source-of-truth và một verdict duy nhất.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc đã chạy.
- Full Python unit+integration pass `100%`.
- Full Rust unit+integration pass `100%`.
- Integration debt mới trong tuần = `0` open.
- W09-W21 regression guard pass.
- Không còn P0 open, không có P1 unowned.
- Artifact consistency `100%`.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W22

### P0

| ID | Issue | Tác động | Điều kiện đóng W22 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W22-ISS-001` | Full Python unit+integration fail | Hard-gate fail ngay | Python suites pass `100%` | `tester` | `Pha 3` |
| `W22-ISS-002` | Full Rust unit+integration fail | Hard-gate fail ngay | Rust suites pass `100%` | `tester` | `Pha 3` |
| `W22-ISS-003` | Cross-runtime integration fail | Release quality không đạt | cross-runtime slices pass | `coder` | `Pha 3` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W22 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W22-ISS-004` | Integration debt mới chưa đóng | Nợ chất lượng dồn W23+ | debt open = 0 | `tester` | `Pha 4` |
| `W22-ISS-005` | Triage thiếu owner/ETA | Ops closure chậm | triage completeness `100%` | `planner` | `Pha 4` |
| `W22-ISS-006` | Correlation/compliance fail | Audit/debug yếu | coverage>=99%, findings=0 | `tester` | `Pha 4` |
| `W22-ISS-007` | W09-W21 regression chưa rerun | Regression risk tích lũy | regression guard pass `100%` | `tester` | `Pha 5` |
| `W22-ISS-008` | Gate artifacts mâu thuẫn verdict | Governance fail | one final verdict across artifacts | `planner` | `Pha 6` |
| `W22-ISS-009` | Week 23 handoff thiếu priorities | W23 kickoff mơ hồ | start pack complete | `planner` | `Pha 7` |
| `W22-ISS-010` | Change budget vượt ngưỡng không escalation | Tăng regression risk | escalation record hợp lệ | `planner` | `Pha 5` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W22 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W22-ISS-011` | Suite runtime/toil chưa đo | Capacity khó dự báo | throughput watermark captured | `ops` | `Pha 5` |
| `W22-ISS-012` | Evidence linkage thiếu suite->issue->gate | Audit chậm | linkage complete | `planner` | `Pha 6` |

---

## 5) Test plan W22 (full-gate2-focused)

### Command profile chuẩn

```bash
python -m pytest tests/unit -q
python -m pytest tests/integration -q
python -m pytest tests/observability -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test --workspace
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
bash scripts/compliance_audit.sh --check-correlation --check-versioning
python scripts/audit_correlation.py --fail-on-findings
```

### Scenario bắt buộc

1. Full Python unit+integration pass `100%`.
2. Full Rust unit+integration pass `100%`.
3. Cross-runtime integration slices pass.
4. Integration debt phát sinh mới = `0` open.
5. Correlation/compliance audits pass (`0 findings`).
6. Regression guard W09-W21 pass sau W22 rollout.
7. Artifact consistency rehearsal pass.
8. Week 23 start pack completeness pass.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W22)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W22: `EV-W22-###`
- Interface/type change (nếu có) bắt buộc có `CR-W22-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W22-T01..W22-T18`.
4. Issue Register snapshot.
5. Rehearsal results (Python/Rust unit+integration, governance, regression).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 23 Start Pack.

---

## 7) KPI dictionary W22

### Hard-Gate Quality

- Full Python Unit+Integration Pass Rate.
- Full Rust Unit+Integration Pass Rate.
- Cross-runtime Integration Pass Rate.
- Integration Debt Closure Rate.

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- P1 Unowned Count.
- W09-W21 Regression Guard Pass Rate.

### Alert & Observability

- Correlation Coverage.
- Compliance Findings Count.

### Engineering Quality

- Change Budget Compliance.
- Regression Count Sau Rerun.

### Governance

- Artifact consistency.
- Evidence completeness.
- Ownership SLA (P1 unowned = 0).

---

## 8) Assumptions & defaults

- W22 là hard-gate tuần hai phase release, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.
- Nếu cần đổi API/interface để đóng hard-gate, phải mở `CR-W22-001`; ưu tiên adapter/compatibility trước.

---

## 9) Execution artifacts (Week 22)

- [week22/KPI_CHARTER_WEEK22.md](week22/KPI_CHARTER_WEEK22.md)
- [week22/FINAL_PHASE_GATE2_BASELINE_REPORT.md](week22/FINAL_PHASE_GATE2_BASELINE_REPORT.md)
- [week22/FINAL_PHASE_GATE2_IMPLEMENTATION_PLAN.md](week22/FINAL_PHASE_GATE2_IMPLEMENTATION_PLAN.md)
- [week22/ISSUE_REGISTER_WEEK22.md](week22/ISSUE_REGISTER_WEEK22.md)
- [week22/INTERFACE_RELEASE_GATE2_SPEC.md](week22/INTERFACE_RELEASE_GATE2_SPEC.md)
- [week22/GATE_REHEARSAL_NOTES.md](week22/GATE_REHEARSAL_NOTES.md)
- [week22/WEEK22_FINAL_REPORT_AND_WEEK23_START_PACK.md](week22/WEEK22_FINAL_REPORT_AND_WEEK23_START_PACK.md)

---

## 10) Execution status (initial)

- `W22-T01..T18`: `PENDING_EXECUTION`.
- Command profile: `PENDING_EXECUTION`.
- Scenario/hardening matrix: `PENDING_EXECUTION`.
- Final gate: `PENDING_DECISION` cho đến khi đủ evidence thật.
