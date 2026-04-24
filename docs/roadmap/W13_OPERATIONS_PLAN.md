# Kế Hoạch Vận Hành Tuần 13 (W13, Strategy Governance)

## 1) Mục tiêu tuần

W13 tập trung triển khai **Strategy Governance** theo roadmap 24 tuần:

1. Thiết lập và enforce checklist OOS/walk-forward cho mọi strategy critical path.
2. Chốt quality gate cho strategy evidence: strategy thiếu bằng chứng bắt buộc phải bị block.
3. Chuẩn hóa decision workflow cho strategy promotion/rejection với owner, rationale và evidence trace đầy đủ.
4. Đo reproducibility drift và kiểm soát parameter drift để giảm overfitting risk.
5. Chốt gate W13 bằng evidence thật để mở W14 Portfolio Controls.

Ràng buộc W13:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W13-###`.
- One-ID policy giữ nguyên: chỉ dùng `correlation_id` trong public docs/log/event.
- W13 phải dùng readiness verdict W12 làm precondition, không bỏ qua evidence thiếu.
- Strategy không đủ OOS/walk-forward evidence bị block, không được promote tạm.
- W13 không thay đổi trading/risk/execution behavior; chỉ governance, checklist và evidence workflow.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W13) |
|---|---|
| Change Budget (W13-W16) | `<= 20 files` và `<= 1000 LOC net` |
| Compile/Static/Lint/Type | `100% pass` |
| Smoke critical path | `>= 95% pass` |
| Correlation coverage critical events | `>= 99%` |
| Alert false-positive sample | `<= 15%` |
| Alert false-negative critical | `= 0` |
| Reproducibility drift | `<= 1%` |
| Exposure/concentration breach mới | `= 0` |
| OOS/walk-forward checklist completeness | `100%` mandatory items |
| Strategy evidence gate enforcement | `100%` strategies thiếu evidence bị block |
| Strategy decision traceability completeness | `100%` |
| Artifact consistency | `100%` |
| W09-W12 regression guard pass rate | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |

---

## 2) Task board theo chu kỳ (W13-T01 -> W13-T18)

### Pha 1: Freeze scope & governance taxonomy

- `W13-T01` Freeze phạm vi W13: strategy governance checklist, OOS/walk-forward evidence gate, promotion decision workflow.
- `W13-T02` Freeze taxonomy governance: strategy status, evidence status, promotion states, block reasons.
- `W13-T03` Freeze quality thresholds: reproducibility drift, exposure/concentration breach, OOS/walk-forward minimum evidence.
- `W13-T03A` Freeze no-behavior-change rule: governance updates không thay đổi production behavior.

### Pha 2: Baseline capture

- `W13-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W13-T05` Chạy command profile strategy-governance-focused, cập nhật matrix `expected/actual`.
- `W13-T06` Capture current gaps: missing OOS evidence, missing walk-forward evidence, decision trace missing, policy drift.

### Pha 3: Governance rollout

- `W13-T07` Lane 1: enforce OOS/walk-forward checklist cho strategy submissions.
- `W13-T08` Lane 2: enforce strategy evidence quality gate (block-by-default khi thiếu mandatory evidence).
- `W13-T09` Lane 3: chuẩn hóa strategy decision trace (approve/reject/defer) với owner, rationale, evidence links.

### Pha 4: Hardening & triage

- `W13-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W13-T11` Reproducibility drift rehearsal và parameter-drift guard verification.
- `W13-T12` Exposure/concentration guard verification để đảm bảo không phát sinh breach mới do governance flow.

### Pha 5: Closure + rerun

- `W13-T13` Rerun baseline sau hardening để xác nhận không regression W09-W12.
- `W13-T14` Khóa issue register theo evidence thật, đóng P0/P1 gate-blocking.

### Pha 6: Gate rehearsal

- `W13-T15` Đồng bộ Baseline -> Issue Register -> KPI -> Gate Notes -> Final Report.
- `W13-T16` Rehearsal verdict `GO/NO-GO` theo phase-4 thresholds.

### Pha 7: Final closeout

- `W13-T17` Xuất final report W13 với một trạng thái gate duy nhất.
- `W13-T18` Chốt Week 14 start pack (Portfolio Controls priorities + guardrails).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- Mọi strategy submission phải có checklist OOS/walk-forward status.
- Strategy thiếu mandatory evidence phải tự động map vào blocker issue.
- Decision log strategy phải có owner, rationale, evidence links và trạng thái block/pass rõ.
- Drift checks phải ghi expected/actual numeric, không chấp nhận pass mô tả chung chung.
- Artifact reconciliation phải có source-of-truth và một verdict duy nhất.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc đã chạy.
- OOS/walk-forward checklist completeness `100%`.
- Strategy evidence gate enforcement `100%`.
- Reproducibility drift `<=1%`.
- Exposure/concentration breach mới `=0`.
- W09-W12 regression guard pass.
- Không còn P0 open, không có P1 unowned.
- Correlation coverage `>=99%`.
- Artifact consistency `100%`.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W13

### P0

| ID | Issue | Tác động | Điều kiện đóng W13 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W13-ISS-001` | Strategy thiếu OOS/walk-forward evidence vẫn được đi tiếp | Overfitting risk tăng cao | thiếu evidence => blocked `100%` | `planner` | `Pha 3` |
| `W13-ISS-002` | Strategy decision workflow thiếu traceability | Audit không truy vết được quyết định | decision trace completeness `100%` | `ops` | `Pha 3` |
| `W13-ISS-003` | Gate artifacts mâu thuẫn verdict | Governance fail | one final verdict across artifacts | `planner` | `Pha 6` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W13 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W13-ISS-004` | OOS checklist thiếu mandatory item mapping | Quality gate không nhất quán | checklist completeness `100%` | `tester` | `Pha 3` |
| `W13-ISS-005` | Walk-forward evidence format drift | So sánh giữa strategies không đáng tin | evidence schema consistency pass | `tester` | `Pha 3` |
| `W13-ISS-006` | Reproducibility drift vượt ngưỡng | Strategy không ổn định | drift `<=1%` | `tester` | `Pha 4` |
| `W13-ISS-007` | Governance flow gây exposure/concentration breach mới | Risk boundary bị vi phạm | new breach count `=0` | `ops` | `Pha 4` |
| `W13-ISS-008` | W09-W12 regression chưa rerun sau governance rollout | Regression risk tích lũy | regression guard pass `100%` | `tester` | `Pha 5` |
| `W13-ISS-009` | Week 14 handoff thiếu priorities/guardrails | W14 kickoff mơ hồ | start pack complete | `planner` | `Pha 7` |
| `W13-ISS-010` | Change budget vượt ngưỡng không escalation | Tăng risk vượt kiểm soát | escalation record hợp lệ | `planner` | `Pha 5` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W13 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W13-ISS-011` | Strategy review throughput/toil chưa đo | Ops load khó dự báo | toil watermark captured | `ops` | `Pha 5` |
| `W13-ISS-012` | Evidence linkage thiếu liên kết checklist->decision->gate | Audit mất thời gian | linkage complete | `planner` | `Pha 6` |

---

## 5) Test plan W13 (strategy-governance-focused)

### Command profile chuẩn

```bash
python -m pytest tests/unit/test_strategy_signals.py -q
python -m pytest tests/test_backtest_integration.py -q
python -m pytest tests/integration/test_backtest_signal_flow.py -q
python -m pytest tests/integration/test_observability_integration.py -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p signal-bridge -p risk-manager
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
bash scripts/compliance_audit.sh --check-correlation --check-versioning
python scripts/audit_correlation.py --fail-on-findings
```

### Scenario bắt buộc

1. OOS checklist enforcement: strategy thiếu OOS evidence bị block.
2. Walk-forward checklist enforcement: strategy thiếu walk-forward evidence bị block.
3. Strategy decision trace includes owner, rationale, evidence links.
4. Reproducibility drift measurement `<=1%`.
5. Exposure/concentration breach mới `=0`.
6. Correlation/compliance audits pass (`0 findings`).
7. Regression guard W09-W12 pass sau W13 rollout.
8. Artifact consistency rehearsal pass.
9. Week 14 start pack completeness pass.
10. Governance blocker mapping completeness pass.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W13)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W13: `EV-W13-###`
- Interface/type change (nếu có) bắt buộc có `CR-W13-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W13-T01..W13-T18`.
4. Issue Register snapshot.
5. Rehearsal results (OOS/walk-forward, drift, governance, regression).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 14 Start Pack.

---

## 7) KPI dictionary W13

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- P1 Unowned Count.
- W09-W12 Regression Guard Pass Rate.

### Strategy Governance

- OOS Checklist Completeness.
- Walk-forward Checklist Completeness.
- Strategy Evidence Gate Enforcement Rate.
- Strategy Decision Traceability Completeness.
- Strategy Review Throughput.

### Strategy Quality

- Reproducibility Drift.
- Parameter Drift Incidents.
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

- W13 là strategy-governance-focused, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.
- W14 handoff chỉ hợp lệ khi W13 có gate decision rõ.
