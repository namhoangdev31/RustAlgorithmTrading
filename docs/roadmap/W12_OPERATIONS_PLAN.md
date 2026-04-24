# Kế Hoạch Vận Hành Tuần 12 (W12, Ops Readiness Gate)

## 1) Mục tiêu tuần

W12 tập trung triển khai **Ops Readiness Gate** theo roadmap 24 tuần:

1. Hợp nhất toàn bộ evidence vận hành từ W09-W11 thành một gate readiness pack có thể kiểm chứng.
2. Chốt readiness của on-call/escalation/incident response cho P0/P1 với owner + backup + SLA rõ ràng.
3. Rehearsal lại critical path vận hành: API health/SLO, alert quality, incident runbook, recovery/rollback readiness.
4. Chặn hoàn toàn trạng thái `GO` nếu còn mismatch giữa baseline, issue register, gate notes, KPI và final report.
5. Chốt gate W12 bằng evidence thật để mở W13 Strategy Governance.

Ràng buộc W12:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W12-###`.
- One-ID policy giữ nguyên: chỉ dùng `correlation_id` trong public docs/log/event.
- W12 phải reuse evidence và taxonomy từ W09-W11; không tự suy diễn pass nếu thiếu capture.
- Không ghi `GO` nếu còn P0 open hoặc P1 unowned.
- W12 không thay đổi trading/risk/execution behavior, chỉ readiness hardening và governance sync.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W12) |
|---|---|
| Change Budget (W09-W12) | `<= 18 files` và `<= 900 LOC net` |
| Compile/Static/Lint/Type | `100% pass` |
| Smoke critical path | `>= 95% pass` |
| Correlation coverage critical events | `>= 99%` |
| Alert false-positive sample | `<= 15%` |
| Alert false-negative critical | `= 0` |
| P0 open | `= 0` |
| P1 unowned | `= 0` |
| Ops readiness checklist completeness | `100%` mandatory items |
| Incident/runbook evidence carry-over validity | `100%` required evidence valid |
| Recovery/rollback readiness drill | `100%` required drills pass |
| Artifact consistency | `100%` |
| W09-W11 regression guard pass rate | `100%` |

---

## 2) Task board theo chu kỳ (W12-T01 -> W12-T18)

### Pha 1: Freeze scope & readiness taxonomy

- `W12-T01` Freeze phạm vi W12: ops readiness gate, ownership readiness, escalation readiness, evidence reconciliation.
- `W12-T02` Freeze readiness checklist dictionary: technical readiness, operational readiness, governance readiness.
- `W12-T03` Freeze gate taxonomy từ W09-W11: severity, reason_code, component, source_event_id, correlation coverage.
- `W12-T03A` Freeze no-behavior-change rule: W12 không mở refactor production path.

### Pha 2: Baseline capture

- `W12-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W12-T05` Chạy command profile readiness-focused, cập nhật matrix `expected/actual`.
- `W12-T06` Capture current gaps: owner coverage, SLA readiness, runbook carry-over validity, artifact consistency.

### Pha 3: Readiness rollout

- `W12-T07` Lane 1: ownership/escalation readiness (P0/P1 owner + backup + SLA + ETA).
- `W12-T08` Lane 2: technical readiness rehearsal (API health/SLO + observability + correlation + compliance).
- `W12-T09` Lane 3: incident/recovery readiness rehearsal (runbook drills + rollback/recovery verification).

### Pha 4: Governance hardening

- `W12-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W12-T11` Chốt issue gating logic: P0 open = 0, P1 unowned = 0, blockers map đủ evidence.
- `W12-T12` Chốt artifact consistency rehearsal theo thứ tự Baseline -> Issue -> KPI -> Gate -> Final.

### Pha 5: Closure + rerun

- `W12-T13` Rerun baseline sau hardening để xác nhận không regression W09-W11.
- `W12-T14` Khóa issue register theo evidence thật, đóng toàn bộ gate-blocking issue.

### Pha 6: Gate rehearsal

- `W12-T15` Rehearsal verdict `GO/NO-GO` theo phase-3 thresholds.
- `W12-T16` Xác nhận một verdict duy nhất trên mọi artifact.

### Pha 7: Final closeout

- `W12-T17` Xuất final report W12 với một trạng thái gate duy nhất.
- `W12-T18` Chốt Week 13 start pack (Strategy Governance priorities + guardrails).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- P1 bắt buộc có owner, không để unowned ở cuối mỗi nhịp.
- Readiness checklist phải có expected/actual/status/evidence_id cho từng mục bắt buộc.
- Incident/recovery rehearsal phải có verify step, không chấp nhận pass dạng mô tả chung chung.
- Artifact reconciliation phải ghi rõ source-of-truth để tránh verdict drift.
- Decision log cuối chu kỳ phản ánh đúng evidence runtime/rehearsal.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc đã chạy.
- Ops readiness checklist completeness `100%`.
- P0 open `= 0`.
- P1 unowned `= 0`.
- Correlation coverage `>=99%`.
- Alert false-positive sample `<=15%`.
- Alert false-negative critical `=0`.
- W09-W11 regression guard pass.
- Artifact consistency `100%`.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W12

### P0

| ID | Issue | Tác động | Điều kiện đóng W12 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W12-ISS-001` | Ops readiness checklist thiếu mandatory evidence | Không thể chốt readiness | readiness checklist `100%` evidence complete | `planner` | `Pha 3` |
| `W12-ISS-002` | Còn P0 open hoặc P1 unowned ở gate cutoff | Gate không hợp lệ | P0 open `=0`, P1 unowned `=0` | `ops` | `Pha 4` |
| `W12-ISS-003` | Gate artifacts mâu thuẫn verdict | Governance fail | one final verdict across artifacts | `planner` | `Pha 6` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W12 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W12-ISS-004` | Ownership/escalation matrix thiếu owner backup/SLA | Incident response không bền | owner+backup+SLA complete | `ops` | `Pha 3` |
| `W12-ISS-005` | Readiness rehearsal API health/SLO thiếu evidence | Không chứng minh operational state | rehearsal evidence pass | `tester` | `Pha 3` |
| `W12-ISS-006` | Readiness rehearsal incident/recovery thiếu verify | Recovery claims không tin cậy | verify evidence complete | `ops` | `Pha 3` |
| `W12-ISS-007` | Correlation/compliance audit chưa đạt | Ops traceability không đủ | audit findings `0` | `tester` | `Pha 3` |
| `W12-ISS-008` | W09-W11 regression chưa rerun | Regression risk tích lũy | regression guard pass `100%` | `tester` | `Pha 5` |
| `W12-ISS-009` | Final handoff W13 thiếu priorities/guardrails | W13 kickoff mơ hồ | start pack complete | `planner` | `Pha 7` |
| `W12-ISS-010` | Change budget vượt ngưỡng không escalation | Tăng risk vượt kiểm soát | escalation record hợp lệ | `planner` | `Pha 5` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W12 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W12-ISS-011` | Readiness runbook/manual toil chưa đo | Ops load chưa dự báo | toil watermark captured | `ops` | `Pha 5` |
| `W12-ISS-012` | Evidence trace path thiếu link chéo | Audit mất thời gian | evidence linkage complete | `planner` | `Pha 6` |

---

## 5) Test plan W12 (ops-readiness-focused)

### Command profile chuẩn

```bash
python -m pytest tests/observability/test_api.py -q
python -m pytest tests/observability -q
python -m pytest tests/integration/test_observability_integration.py -q
python -m pytest tests/integration/test_backtest_signal_flow.py -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p execution-engine -p risk-manager
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
bash scripts/compliance_audit.sh --check-correlation --check-versioning
python scripts/audit_correlation.py --fail-on-findings
```

### Scenario bắt buộc

1. Ops readiness checklist mandatory items complete with evidence.
2. P0/P1 ownership readiness: owner + backup + SLA mapping đầy đủ.
3. API health/SLO readiness rehearsal pass.
4. Incident runbook readiness rehearsal pass.
5. Recovery/rollback readiness rehearsal pass.
6. Correlation continuity audit `0 findings`.
7. Compliance/version audit pass.
8. Artifact consistency rehearsal pass.
9. W09-W11 regression slices pass.
10. Week 13 start pack completeness pass.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W12)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W12: `EV-W12-###`
- Interface/type change (nếu có) bắt buộc có `CR-W12-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W12-T01..W12-T18`.
4. Issue Register snapshot.
5. Rehearsal results (readiness, ownership/escalation, correlation/compliance, regression).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 13 Start Pack.

---

## 7) KPI dictionary W12

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- P1 Unowned Count.
- W09-W11 Regression Guard Pass Rate.

### Ops Readiness

- Mandatory Readiness Checklist Completeness.
- Ownership/Escalation Matrix Completeness.
- Incident Runbook Readiness Pass Rate.
- Recovery/Rollback Readiness Pass Rate.
- Evidence Traceability Completeness.

### Alert & Observability

- Correlation Coverage.
- Alert False Positive Sample Rate.
- Alert False Negative Critical Count.
- Compliance Audit Pass Rate.

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

- W12 là ops-readiness/gate-focused, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.
- W13 handoff chỉ hợp lệ khi W12 có gate decision rõ.
