# Kế Hoạch Vận Hành Tuần 16 (W16, Research Reproducibility)

## 1) Mục tiêu tuần

W16 tập trung triển khai **Research Reproducibility** theo roadmap 24 tuần:

1. Chuẩn hóa reproducibility pack gồm seed control, rerun profile và evidence schema.
2. Enforce deterministic rerun workflow để giảm biến thiên kết quả nghiên cứu.
3. Chốt reproducibility thresholds và exception handling cho các case hợp lệ.
4. Chuẩn hóa decision workflow cho pass/fail reproducibility với owner + rationale + evidence.
5. Chốt gate W16 bằng evidence thật để mở W17 Staging Hardening.

Ràng buộc W16:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W16-###`.
- One-ID policy giữ nguyên: chỉ dùng `correlation_id` trong public docs/log/event.
- W16 phải dùng verdict W15 làm precondition.
- W16 không chốt `GO` nếu reproducibility pack hoặc seed control thiếu evidence bắt buộc.
- W16 không thay đổi production behavior ngoài reproducibility-critical governance path.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W16) |
|---|---|
| Change Budget (W13-W16) | `<= 20 files` và `<= 1000 LOC net` |
| Compile/Static/Lint/Type | `100% pass` |
| Smoke critical path | `>= 95% pass` |
| Correlation coverage critical events | `>= 99%` |
| Alert false-positive sample | `<= 15%` |
| Alert false-negative critical | `= 0` |
| Reproducibility drift | `<= 1%` |
| Seed-control compliance | `100%` required runs |
| Deterministic rerun profile coverage | `100%` required scenarios |
| Reproducibility checklist completeness | `100%` mandatory items |
| Exposure/concentration breach mới | `= 0` |
| Artifact consistency | `100%` |
| W09-W15 regression guard pass rate | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |

---

## 2) Task board theo chu kỳ (W16-T01 -> W16-T18)

### Pha 1: Freeze scope & reproducibility taxonomy

- `W16-T01` Freeze phạm vi W16: reproducibility pack, seed control, rerun governance, decision traceability.
- `W16-T02` Freeze reproducibility taxonomy: seed profile, rerun class, deterministic status, exception reasons.
- `W16-T03` Freeze thresholds: drift tolerance, rerun count, pass/fail mapping.
- `W16-T03A` Freeze no-broad-refactor rule: W16 chỉ hardening reproducibility path.

### Pha 2: Baseline capture

- `W16-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W16-T05` Chạy command profile reproducibility-focused, cập nhật matrix `expected/actual`.
- `W16-T06` Capture gaps: missing seed control evidence, rerun inconsistency, decision trace drift, policy mismatch.

### Pha 3: Reproducibility rollout

- `W16-T07` Lane 1: enforce seed-control policy cho tất cả rerun scenarios bắt buộc.
- `W16-T08` Lane 2: enforce deterministic rerun profile + threshold checks.
- `W16-T09` Lane 3: chuẩn hóa reproducibility decision trace (pass/fail/defer/block).

### Pha 4: Hardening & triage

- `W16-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W16-T11` Multi-rerun consistency rehearsal và drift verification.
- `W16-T12` Reproducibility exception-handling rehearsal + governance consistency.

### Pha 5: Closure + rerun

- `W16-T13` Rerun baseline sau hardening để xác nhận không regression W09-W15.
- `W16-T14` Khóa issue register theo evidence thật, đóng P0/P1 gate-blocking.

### Pha 6: Gate rehearsal

- `W16-T15` Đồng bộ Baseline -> Issue Register -> KPI -> Gate Notes -> Final Report.
- `W16-T16` Rehearsal verdict `GO/NO-GO` theo phase-4 thresholds.

### Pha 7: Final closeout

- `W16-T17` Xuất final report W16 với một trạng thái gate duy nhất.
- `W16-T18` Chốt Week 17 start pack (Staging Hardening priorities + guardrails).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- Mọi rerun bắt buộc phải ghi seed profile + rerun metadata.
- Drift checks phải có expected/actual numeric.
- Exception handling phải có reason và approval trail.
- Artifact reconciliation phải có source-of-truth và một verdict duy nhất.
- Decision log cuối chu kỳ phản ánh đúng evidence runtime/rehearsal.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc đã chạy.
- Reproducibility checklist completeness `100%`.
- Seed-control compliance `100%`.
- Deterministic rerun profile coverage `100%`.
- Reproducibility drift `<=1%`.
- Exposure/concentration breach mới `=0`.
- W09-W15 regression guard pass.
- Không còn P0 open, không có P1 unowned.
- Artifact consistency `100%`.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W16

### P0

| ID | Issue | Tác động | Điều kiện đóng W16 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W16-ISS-001` | Seed control không enforce cho rerun bắt buộc | Kết quả không thể tái lập | seed-control compliance `100%` | `tester` | `Pha 3` |
| `W16-ISS-002` | Deterministic rerun profile không ổn định | Drift vượt ngưỡng | deterministic profile coverage `100%` + drift `<=1%` | `tester` | `Pha 3` |
| `W16-ISS-003` | Gate artifacts mâu thuẫn verdict | Governance fail | one final verdict across artifacts | `planner` | `Pha 6` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W16 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W16-ISS-004` | Reproducibility checklist thiếu mandatory items | Quality gate không nhất quán | checklist completeness `100%` | `planner` | `Pha 3` |
| `W16-ISS-005` | Rerun metadata/decision trace thiếu | Audit không truy vết được | decision trace completeness `100%` | `planner` | `Pha 3` |
| `W16-ISS-006` | Multi-rerun consistency rehearsal fail | Reproducibility không đáng tin | consistency pass theo threshold | `tester` | `Pha 4` |
| `W16-ISS-007` | Exception handling policy drift | Pass/fail logic không ổn định | exception policy consistency pass | `ops` | `Pha 4` |
| `W16-ISS-008` | W09-W15 regression chưa rerun sau rollout | Regression risk tích lũy | regression guard pass `100%` | `tester` | `Pha 5` |
| `W16-ISS-009` | Week 17 handoff thiếu priorities/guardrails | W17 kickoff mơ hồ | start pack complete | `planner` | `Pha 7` |
| `W16-ISS-010` | Change budget vượt ngưỡng không escalation | Tăng risk vượt kiểm soát | escalation record hợp lệ | `planner` | `Pha 5` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W16 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W16-ISS-011` | Rerun throughput/toil chưa đo | Ops load khó dự báo | toil watermark captured | `ops` | `Pha 5` |
| `W16-ISS-012` | Evidence linkage thiếu liên kết seed->rerun->decision->gate | Audit mất thời gian | linkage complete | `planner` | `Pha 6` |

---

## 5) Test plan W16 (reproducibility-focused)

### Command profile chuẩn

```bash
python -m pytest tests/test_backtest_integration.py -q
python -m pytest tests/unit/test_strategy_signals.py -q
python -m pytest tests/integration/test_backtest_signal_flow.py -q
python -m pytest tests/integration/test_observability_integration.py -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p risk-manager -p execution-engine
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
bash scripts/compliance_audit.sh --check-correlation --check-versioning
python scripts/audit_correlation.py --fail-on-findings
```

### Scenario bắt buộc

1. Seed-control enforcement pass cho tất cả rerun bắt buộc.
2. Deterministic rerun profile enforcement pass.
3. Multi-rerun consistency pass theo threshold.
4. Reproducibility decision trace includes owner, reason, evidence links.
5. Reproducibility drift measurement `<=1%`.
6. Exception-handling policy consistency pass.
7. Correlation/compliance audits pass (`0 findings`).
8. Regression guard W09-W15 pass sau W16 rollout.
9. Artifact consistency rehearsal pass.
10. Week 17 start pack completeness pass.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W16)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W16: `EV-W16-###`
- Interface/type change (nếu có) bắt buộc có `CR-W16-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W16-T01..W16-T18`.
4. Issue Register snapshot.
5. Rehearsal results (seed control, rerun consistency, drift, governance, regression).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 17 Start Pack.

---

## 7) KPI dictionary W16

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- P1 Unowned Count.
- W09-W15 Regression Guard Pass Rate.

### Reproducibility Controls

- Seed-control Compliance Rate.
- Deterministic Rerun Profile Coverage.
- Reproducibility Checklist Completeness.
- Reproducibility Decision Traceability Completeness.
- Multi-rerun Consistency Pass Rate.

### Research Quality

- Reproducibility Drift.
- Exception-handling Consistency.
- Exposure/Concentration New Breach Count.

### Observability & Evidence

- Correlation Coverage.
- Compliance Audit Pass Rate.
- Evidence Linkage Completeness.

### Engineering Quality

- Build/Static Check Profile Stability.
- Change Budget Compliance.
- Regression Count Sau Rerun.

### Governance

- Artifact consistency.
- Evidence completeness.
- Owner/ETA completeness.

---

## 8) Assumptions & defaults

- W16 là reproducibility-focused, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.
- W17 handoff chỉ hợp lệ khi W16 có gate decision rõ.
