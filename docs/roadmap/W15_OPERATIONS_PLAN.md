# Kế Hoạch Vận Hành Tuần 15 (W15, Capital Allocation)

## 1) Mục tiêu tuần

W15 tập trung triển khai **Capital Allocation** theo roadmap 24 tuần:

1. Chuẩn hóa position sizing theo volatility/regime trên critical strategy set.
2. Enforce drawdown policy adherence ở cấp strategy và portfolio interaction.
3. Chuẩn hóa allocation decision workflow với owner, rationale, evidence và rollback notes.
4. Chốt guardrail để allocation không phá vỡ exposure/concentration controls từ W14.
5. Chốt gate W15 bằng evidence thật để mở W16 Research Reproducibility.

Ràng buộc W15:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W15-###`.
- One-ID policy giữ nguyên: chỉ dùng `correlation_id` trong public docs/log/event.
- W15 phải dùng verdict W14 làm precondition.
- W15 không chốt `GO` nếu allocation checks hoặc drawdown adherence thiếu evidence bắt buộc.
- W15 không thay đổi production behavior ngoài allocation-critical path đã freeze.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W15) |
|---|---|
| Change Budget (W13-W16) | `<= 20 files` và `<= 1000 LOC net` |
| Compile/Static/Lint/Type | `100% pass` |
| Smoke critical path | `>= 95% pass` |
| Correlation coverage critical events | `>= 99%` |
| Alert false-positive sample | `<= 15%` |
| Alert false-negative critical | `= 0` |
| Reproducibility drift | `<= 1%` |
| Exposure/concentration breach mới | `= 0` |
| Allocation checklist completeness | `100%` mandatory items |
| Drawdown policy adherence | `100%` required checks |
| Volatility/regime sizing coverage | `100%` required scenarios |
| Artifact consistency | `100%` |
| W09-W14 regression guard pass rate | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |

---

## 2) Task board theo chu kỳ (W15-T01 -> W15-T18)

### Pha 1: Freeze scope & allocation taxonomy

- `W15-T01` Freeze phạm vi W15: capital allocation, position sizing, drawdown adherence, cross-strategy allocation interaction.
- `W15-T02` Freeze allocation taxonomy: sizing mode, regime class, volatility bucket, drawdown states, block reasons.
- `W15-T03` Freeze thresholds: max position sizing band, drawdown limit behavior, escalation mapping.
- `W15-T03A` Freeze no-broad-refactor rule: W15 chỉ hardening allocation path.

### Pha 2: Baseline capture

- `W15-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W15-T05` Chạy command profile allocation-focused, cập nhật matrix `expected/actual`.
- `W15-T06` Capture gaps: missing volatility scaling evidence, regime-mapping gaps, drawdown policy mismatch, decision trace drift.

### Pha 3: Allocation rollout

- `W15-T07` Lane 1: enforce position sizing theo volatility bands.
- `W15-T08` Lane 2: enforce regime-aware allocation behavior.
- `W15-T09` Lane 3: enforce drawdown policy adherence + standardized allocation decision trace.

### Pha 4: Hardening & triage

- `W15-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W15-T11` Cross-strategy allocation interaction rehearsal để xác nhận không tạo breach mới.
- `W15-T12` Reproducibility + allocation consistency rehearsal.

### Pha 5: Closure + rerun

- `W15-T13` Rerun baseline sau hardening để xác nhận không regression W09-W14.
- `W15-T14` Khóa issue register theo evidence thật, đóng P0/P1 gate-blocking.

### Pha 6: Gate rehearsal

- `W15-T15` Đồng bộ Baseline -> Issue Register -> KPI -> Gate Notes -> Final Report.
- `W15-T16` Rehearsal verdict `GO/NO-GO` theo phase-4 thresholds.

### Pha 7: Final closeout

- `W15-T17` Xuất final report W15 với một trạng thái gate duy nhất.
- `W15-T18` Chốt Week 16 start pack (Research Reproducibility priorities + guardrails).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- Mọi allocation decision phải ghi volatility/regime context + drawdown context.
- Drawdown checks phải có expected/actual numeric.
- Cross-strategy allocation rehearsal phải có evidence end-to-end.
- Artifact reconciliation phải có source-of-truth và một verdict duy nhất.
- Decision log cuối chu kỳ phản ánh đúng evidence runtime/rehearsal.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc đã chạy.
- Allocation checklist completeness `100%`.
- Drawdown policy adherence `100%`.
- Volatility/regime sizing coverage `100%`.
- Exposure/concentration breach mới `=0`.
- Reproducibility drift `<=1%`.
- W09-W14 regression guard pass.
- Không còn P0 open, không có P1 unowned.
- Artifact consistency `100%`.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W15

### P0

| ID | Issue | Tác động | Điều kiện đóng W15 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W15-ISS-001` | Position sizing không tuân policy volatility/regime | Allocation risk sai lệch | volatility/regime sizing coverage `100%` | `ops` | `Pha 3` |
| `W15-ISS-002` | Drawdown policy không enforce đúng flow | Risk containment thất bại | drawdown adherence `100%` | `ops` | `Pha 3` |
| `W15-ISS-003` | Gate artifacts mâu thuẫn verdict | Governance fail | one final verdict across artifacts | `planner` | `Pha 6` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W15 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W15-ISS-004` | Allocation checklist thiếu mandatory items | Quality gate không nhất quán | checklist completeness `100%` | `tester` | `Pha 3` |
| `W15-ISS-005` | Allocation decision trace thiếu metadata | Audit không truy vết được | decision trace completeness `100%` | `planner` | `Pha 3` |
| `W15-ISS-006` | Cross-strategy allocation interaction gây breach mới | Risk boundary bị vi phạm | new breach count `=0` | `ops` | `Pha 4` |
| `W15-ISS-007` | Reproducibility drift vượt ngưỡng | Kết quả allocation không ổn định | drift `<=1%` | `tester` | `Pha 4` |
| `W15-ISS-008` | W09-W14 regression chưa rerun sau rollout | Regression risk tích lũy | regression guard pass `100%` | `tester` | `Pha 5` |
| `W15-ISS-009` | Week 16 handoff thiếu priorities/guardrails | W16 kickoff mơ hồ | start pack complete | `planner` | `Pha 7` |
| `W15-ISS-010` | Change budget vượt ngưỡng không escalation | Tăng risk vượt kiểm soát | escalation record hợp lệ | `planner` | `Pha 5` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W15 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W15-ISS-011` | Allocation review throughput/toil chưa đo | Ops load khó dự báo | toil watermark captured | `ops` | `Pha 5` |
| `W15-ISS-012` | Evidence linkage thiếu liên kết sizing->decision->gate | Audit mất thời gian | linkage complete | `planner` | `Pha 6` |

---

## 5) Test plan W15 (capital-allocation-focused)

### Command profile chuẩn

```bash
python -m pytest tests/test_backtest_integration.py -q
python -m pytest tests/unit/test_strategy_signals.py -q
python -m pytest tests/integration/test_backtest_signal_flow.py -q
python -m pytest tests/integration/test_observability_integration.py -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p risk-manager -p signal-bridge
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p execution-engine -p common
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
bash scripts/compliance_audit.sh --check-correlation --check-versioning
python scripts/audit_correlation.py --fail-on-findings
```

### Scenario bắt buộc

1. Volatility-based sizing enforcement pass.
2. Regime-aware sizing enforcement pass.
3. Drawdown adherence checks pass.
4. Cross-strategy allocation interaction không tạo breach mới.
5. Allocation decision trace includes owner, reason, evidence links.
6. Reproducibility drift measurement `<=1%`.
7. Correlation/compliance audits pass (`0 findings`).
8. Regression guard W09-W14 pass sau W15 rollout.
9. Artifact consistency rehearsal pass.
10. Week 16 start pack completeness pass.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W15)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W15: `EV-W15-###`
- Interface/type change (nếu có) bắt buộc có `CR-W15-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W15-T01..W15-T18`.
4. Issue Register snapshot.
5. Rehearsal results (allocation, drawdown, drift, governance, regression).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 16 Start Pack.

---

## 7) KPI dictionary W15

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- P1 Unowned Count.
- W09-W14 Regression Guard Pass Rate.

### Capital Allocation

- Volatility Sizing Enforcement Rate.
- Regime-aware Sizing Enforcement Rate.
- Allocation Checklist Completeness.
- Allocation Decision Traceability Completeness.
- Cross-strategy Allocation Interaction Coverage.

### Risk Quality

- Drawdown Policy Adherence Rate.
- Exposure/Concentration New Breach Count.
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

- W15 là capital-allocation-focused, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.
- W16 handoff chỉ hợp lệ khi W15 có gate decision rõ.
