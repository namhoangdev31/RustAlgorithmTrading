# Kế Hoạch Vận Hành Tuần 21 (W21, Final-Phase Gate 1)

## 1) Mục tiêu tuần

W21 tập trung triển khai **Final-Phase Gate 1** theo roadmap 24 tuần:

1. Chạy full lint/type/static + unit baseline toàn repo theo hard-gate rule.
2. Đóng test debt phát sinh trong tuần và khóa release-blocker taxonomy.
3. Bảo đảm không có regression an toàn từ W09-W20 trước khi mở W22.
4. Chốt gate W21 bằng evidence thật với một verdict duy nhất.

Ràng buộc W21:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W21-###`.
- One-ID policy giữ nguyên: chỉ dùng `correlation_id`.
- W21 là hard-gate tuần đầu của phase release: không defer test debt sang tuần kế tiếp.
- W21 không chốt `GO` nếu còn bất kỳ required suite fail.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W21) |
|---|---|
| Change Budget (W21-W24) | `<= 15 files` và `<= 700 LOC net` |
| Full lint | `100% pass` |
| Full type + static | `100% pass` |
| Full unit baseline | `100% pass` |
| Test debt mới trong tuần | `0` open tại gate lock |
| Smoke critical path | `>= 95% pass` |
| Correlation coverage critical events | `>= 99%` |
| Compliance findings | `0` |
| W09-W20 regression guard pass rate | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |
| Artifact consistency | `100%` |

---

## 2) Task board theo chu kỳ (W21-T01 -> W21-T18)

### Pha 1: Freeze scope & hard-gate taxonomy

- `W21-T01` Freeze phạm vi W21: full lint/type/static/unit baseline + debt closure.
- `W21-T02` Freeze taxonomy: release blockers, suite classes, debt classes.
- `W21-T03` Freeze acceptance thresholds cho hard-gate.
- `W21-T03A` Freeze no-broad-refactor rule: chỉ sửa tối thiểu để đóng gate fail thực.

### Pha 2: Baseline capture

- `W21-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W21-T05` Chạy command profile hard-gate1, cập nhật matrix `expected/actual`.
- `W21-T06` Capture gaps: lint/type/static/unit failures, debt ownership gaps.

### Pha 3: Hard-gate1 rollout

- `W21-T07` Lane 1: closure lint/static/type failures.
- `W21-T08` Lane 2: unit baseline closure theo module ownership.
- `W21-T09` Lane 3: test debt closure + rerun deterministic.

### Pha 4: Triage & governance closure

- `W21-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W21-T11` Recheck release blockers mapping + escalation logs nếu vượt budget.
- `W21-T12` Compliance/correlation rehearse và khóa findings.

### Pha 5: Closure + rerun

- `W21-T13` Rerun full hard-gate1 profile sau fixes để xác nhận pass liên tục.
- `W21-T14` Khóa issue register theo evidence thật, đóng P0/P1 gate-blocking.

### Pha 6: Gate rehearsal

- `W21-T15` Đồng bộ Baseline -> Issue Register -> KPI -> Gate Notes -> Final Report.
- `W21-T16` Rehearsal verdict `GO/NO-GO` theo phase-6 thresholds.

### Pha 7: Final closeout

- `W21-T17` Xuất final report W21 với một trạng thái gate duy nhất.
- `W21-T18` Chốt Week 22 start pack (full Python/Rust unit + integration priorities).

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
- Full lint/type/static pass `100%`.
- Full unit baseline pass `100%`.
- Test debt mới trong tuần = `0` open.
- W09-W20 regression guard pass.
- Không còn P0 open, không có P1 unowned.
- Artifact consistency `100%`.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W21

### P0

| ID | Issue | Tác động | Điều kiện đóng W21 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W21-ISS-001` | Full lint fail | Hard-gate fail ngay | lint pass `100%` | `coder` | `Pha 3` |
| `W21-ISS-002` | Full type/static fail | Hard-gate fail ngay | type/static pass `100%` | `coder` | `Pha 3` |
| `W21-ISS-003` | Full unit baseline fail | Release quality không đạt | unit baseline pass `100%` | `tester` | `Pha 3` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W21 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W21-ISS-004` | Test debt mới chưa đóng | Nợ chất lượng dồn W22+ | debt open = 0 | `tester` | `Pha 4` |
| `W21-ISS-005` | Triage thiếu owner/ETA | Ops closure chậm | triage completeness `100%` | `planner` | `Pha 4` |
| `W21-ISS-006` | Correlation/compliance fail | Audit/debug yếu | coverage>=99%, findings=0 | `tester` | `Pha 4` |
| `W21-ISS-007` | W09-W20 regression chưa rerun | Regression risk tích lũy | regression guard pass `100%` | `tester` | `Pha 5` |
| `W21-ISS-008` | Gate artifacts mâu thuẫn verdict | Governance fail | one final verdict across artifacts | `planner` | `Pha 6` |
| `W21-ISS-009` | Week 22 handoff thiếu priorities | W22 kickoff mơ hồ | start pack complete | `planner` | `Pha 7` |
| `W21-ISS-010` | Change budget vượt ngưỡng không escalation | Tăng regression risk | escalation record hợp lệ | `planner` | `Pha 5` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W21 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W21-ISS-011` | Suite runtime/toil chưa đo | Capacity khó dự báo | throughput watermark captured | `ops` | `Pha 5` |
| `W21-ISS-012` | Evidence linkage thiếu suite->issue->gate | Audit chậm | linkage complete | `planner` | `Pha 6` |

---

## 5) Test plan W21 (full-gate1-focused)

### Command profile chuẩn

```bash
python -m pytest tests/unit -q
python -m pytest tests/observability -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test --workspace
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
bash scripts/compliance_audit.sh --check-correlation --check-versioning
python scripts/audit_correlation.py --fail-on-findings
```

### Scenario bắt buộc

1. Full lint/type/static pass `100%`.
2. Full unit baseline pass `100%` (Python + Rust).
3. Test debt phát sinh mới = `0` open.
4. Correlation/compliance audits pass (`0 findings`).
5. Regression guard W09-W20 pass sau W21 rollout.
6. Artifact consistency rehearsal pass.
7. Week 22 start pack completeness pass.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W21)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W21: `EV-W21-###`
- Interface/type change (nếu có) bắt buộc có `CR-W21-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W21-T01..W21-T18`.
4. Issue Register snapshot.
5. Rehearsal results (lint/type/static, unit baseline, governance, regression).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 22 Start Pack.

---

## 7) KPI dictionary W21

### Hard-Gate Quality

- Full Lint Pass Rate.
- Full Type/Static Pass Rate.
- Full Unit Baseline Pass Rate.
- Test Debt Closure Rate.

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- P1 Unowned Count.
- W09-W20 Regression Guard Pass Rate.

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

- W21 là hard-gate tuần đầu phase release, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.
- Nếu cần đổi API/interface để đóng hard-gate, phải mở `CR-W21-001`; ưu tiên adapter/compatibility trước.

---

## 9) Execution artifacts (Week 21)

- [week21/KPI_CHARTER_WEEK21.md](week21/KPI_CHARTER_WEEK21.md)
- [week21/FINAL_PHASE_GATE1_BASELINE_REPORT.md](week21/FINAL_PHASE_GATE1_BASELINE_REPORT.md)
- [week21/FINAL_PHASE_GATE1_IMPLEMENTATION_PLAN.md](week21/FINAL_PHASE_GATE1_IMPLEMENTATION_PLAN.md)
- [week21/ISSUE_REGISTER_WEEK21.md](week21/ISSUE_REGISTER_WEEK21.md)
- [week21/INTERFACE_RELEASE_GATE1_SPEC.md](week21/INTERFACE_RELEASE_GATE1_SPEC.md)
- [week21/GATE_REHEARSAL_NOTES.md](week21/GATE_REHEARSAL_NOTES.md)
- [week21/WEEK21_FINAL_REPORT_AND_WEEK22_START_PACK.md](week21/WEEK21_FINAL_REPORT_AND_WEEK22_START_PACK.md)

---

## 10) Execution status (initial)

- `W21-T01..T18`: `PENDING_EXECUTION`.
- Command profile: `PENDING_EXECUTION`.
- Scenario/hardening matrix: `PENDING_EXECUTION`.
- Final gate: `PENDING_DECISION` cho đến khi đủ evidence thật.
