# Kế Hoạch Vận Hành Tuần 14 (W14, Portfolio Controls)

## 1) Mục tiêu tuần

W14 tập trung triển khai **Portfolio Controls** theo roadmap 24 tuần:

1. Enforce exposure controls ở cấp portfolio để chặn vượt ngưỡng tổng rủi ro.
2. Enforce concentration controls theo symbol/cluster để tránh lệch phân bổ quá mức.
3. Chuẩn hóa policy cho portfolio risk checks, ownership và escalation khi vi phạm.
4. Chốt evidence cho cross-strategy interactions mà không tạo breach mới.
5. Chốt gate W14 bằng evidence thật để mở W15 Capital Allocation.

Ràng buộc W14:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W14-###`.
- One-ID policy giữ nguyên: chỉ dùng `correlation_id` trong public docs/log/event.
- W14 phải dùng W13 governance verdict làm precondition.
- W14 không chốt `GO` nếu exposure/concentration checks thiếu evidence bắt buộc.
- W14 không thay đổi trading/risk/execution behavior ngoài phạm vi portfolio-control hardening cần thiết.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W14) |
|---|---|
| Change Budget (W13-W16) | `<= 20 files` và `<= 1000 LOC net` |
| Compile/Static/Lint/Type | `100% pass` |
| Smoke critical path | `>= 95% pass` |
| Correlation coverage critical events | `>= 99%` |
| Alert false-positive sample | `<= 15%` |
| Alert false-negative critical | `= 0` |
| Reproducibility drift | `<= 1%` |
| Exposure breach mới | `= 0` |
| Concentration breach mới | `= 0` |
| Portfolio control checklist completeness | `100%` mandatory items |
| Cross-strategy risk interaction coverage | `100%` required scenarios |
| Artifact consistency | `100%` |
| W09-W13 regression guard pass rate | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |

---

## 2) Task board theo chu kỳ (W14-T01 -> W14-T18)

### Pha 1: Freeze scope & risk-control taxonomy

- `W14-T01` Freeze phạm vi W14: exposure/concentration controls, portfolio risk checks, escalation policy.
- `W14-T02` Freeze portfolio-control taxonomy: limit types, breach levels, block reasons, ownership rules.
- `W14-T03` Freeze thresholds: max exposure, max concentration, breach severity mapping.
- `W14-T03A` Freeze no-behavior-change rule: W14 không mở refactor lan rộng ngoài portfolio-control path.

### Pha 2: Baseline capture

- `W14-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W14-T05` Chạy command profile portfolio-controls-focused, cập nhật matrix `expected/actual`.
- `W14-T06` Capture current gaps: missing exposure checks, missing concentration checks, stale risk snapshot, policy drift.

### Pha 3: Controls rollout

- `W14-T07` Lane 1: enforce total exposure controls ở portfolio level.
- `W14-T08` Lane 2: enforce concentration controls theo symbol/cluster.
- `W14-T09` Lane 3: chuẩn hóa portfolio risk decision trace (allow/reject/defer) với evidence links.

### Pha 4: Hardening & triage

- `W14-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W14-T11` Cross-strategy interaction rehearsal để xác nhận không phát sinh breach mới.
- `W14-T12` Reproducibility + risk-control consistency rehearsal.

### Pha 5: Closure + rerun

- `W14-T13` Rerun baseline sau hardening để xác nhận không regression W09-W13.
- `W14-T14` Khóa issue register theo evidence thật, đóng P0/P1 gate-blocking.

### Pha 6: Gate rehearsal

- `W14-T15` Đồng bộ Baseline -> Issue Register -> KPI -> Gate Notes -> Final Report.
- `W14-T16` Rehearsal verdict `GO/NO-GO` theo phase-4 thresholds.

### Pha 7: Final closeout

- `W14-T17` Xuất final report W14 với một trạng thái gate duy nhất.
- `W14-T18` Chốt Week 15 start pack (Capital Allocation priorities + guardrails).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- Mọi portfolio decision phải ghi rõ exposure/concentration context và status.
- Breach detection phải có expected/actual numeric, không chấp nhận pass dạng mô tả chung.
- Cross-strategy scenario rehearsal phải có evidence end-to-end.
- Artifact reconciliation phải có source-of-truth và một verdict duy nhất.
- Decision log cuối chu kỳ phản ánh đúng evidence runtime/rehearsal.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc đã chạy.
- Portfolio controls checklist completeness `100%`.
- Exposure breach mới `=0`.
- Concentration breach mới `=0`.
- Reproducibility drift `<=1%`.
- W09-W13 regression guard pass.
- Không còn P0 open, không có P1 unowned.
- Correlation coverage `>=99%`.
- Artifact consistency `100%`.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W14

### P0

| ID | Issue | Tác động | Điều kiện đóng W14 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W14-ISS-001` | Exposure controls không chặn vượt ngưỡng đúng policy | Portfolio risk breach | exposure breach mới `=0` | `ops` | `Pha 3` |
| `W14-ISS-002` | Concentration controls không chặn lệch phân bổ | Concentration risk tăng cao | concentration breach mới `=0` | `ops` | `Pha 3` |
| `W14-ISS-003` | Gate artifacts mâu thuẫn verdict | Governance fail | one final verdict across artifacts | `planner` | `Pha 6` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W14 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W14-ISS-004` | Portfolio-control checklist thiếu mandatory items | Quality gate không nhất quán | checklist completeness `100%` | `tester` | `Pha 3` |
| `W14-ISS-005` | Breach reason/decision trace thiếu metadata | Audit không truy vết được | decision trace completeness `100%` | `planner` | `Pha 3` |
| `W14-ISS-006` | Cross-strategy interaction gây breach mới | Risk boundary bị vi phạm | new breach count `=0` | `ops` | `Pha 4` |
| `W14-ISS-007` | Reproducibility drift vượt ngưỡng | Kết quả governance không ổn định | drift `<=1%` | `tester` | `Pha 4` |
| `W14-ISS-008` | W09-W13 regression chưa rerun sau rollout | Regression risk tích lũy | regression guard pass `100%` | `tester` | `Pha 5` |
| `W14-ISS-009` | Week 15 handoff thiếu priorities/guardrails | W15 kickoff mơ hồ | start pack complete | `planner` | `Pha 7` |
| `W14-ISS-010` | Change budget vượt ngưỡng không escalation | Tăng risk vượt kiểm soát | escalation record hợp lệ | `planner` | `Pha 5` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W14 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W14-ISS-011` | Portfolio review throughput/toil chưa đo | Ops load khó dự báo | toil watermark captured | `ops` | `Pha 5` |
| `W14-ISS-012` | Evidence linkage thiếu liên kết controls->decision->gate | Audit mất thời gian | linkage complete | `planner` | `Pha 6` |

---

## 5) Test plan W14 (portfolio-controls-focused)

### Command profile chuẩn

```bash
python -m pytest tests/test_backtest_integration.py -q
python -m pytest tests/integration/test_backtest_signal_flow.py -q
python -m pytest tests/integration/test_observability_integration.py -q
python -m pytest tests/unit/test_strategy_signals.py -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p risk-manager -p execution-engine
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
bash scripts/compliance_audit.sh --check-correlation --check-versioning
python scripts/audit_correlation.py --fail-on-findings
```

### Scenario bắt buộc

1. Total exposure limit enforcement pass.
2. Concentration limit enforcement pass.
3. Cross-strategy interaction không tạo breach mới.
4. Portfolio decision trace includes owner, reason, evidence links.
5. Reproducibility drift measurement `<=1%`.
6. Correlation/compliance audits pass (`0 findings`).
7. Regression guard W09-W13 pass sau W14 rollout.
8. Artifact consistency rehearsal pass.
9. Week 15 start pack completeness pass.
10. Governance blocker mapping completeness pass.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W14)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W14: `EV-W14-###`
- Interface/type change (nếu có) bắt buộc có `CR-W14-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W14-T01..W14-T18`.
4. Issue Register snapshot.
5. Rehearsal results (exposure/concentration, drift, governance, regression).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 15 Start Pack.

---

## 7) KPI dictionary W14

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- P1 Unowned Count.
- W09-W13 Regression Guard Pass Rate.

### Portfolio Controls

- Exposure Control Enforcement Rate.
- Concentration Control Enforcement Rate.
- Portfolio Control Checklist Completeness.
- Portfolio Decision Traceability Completeness.
- Cross-strategy Interaction Coverage.

### Portfolio Risk Quality

- Exposure New Breach Count.
- Concentration New Breach Count.
- Reproducibility Drift.

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

- W14 là portfolio-controls-focused, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.
- W15 handoff chỉ hợp lệ khi W14 có gate decision rõ.
