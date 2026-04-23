# Kế Hoạch Vận Hành Tuần 5 (W05, Risk Limits v1)

## 1) Mục tiêu tuần

W05 tập trung triển khai **Risk Limits v1** theo roadmap 24 tuần:

1. Áp dụng giới hạn rủi ro theo `symbol` và `strategy` trên critical path.
2. Chuẩn hóa reject semantics để mọi quyết định từ risk layer nhất quán và truy vết được.
3. Giữ ổn định tích hợp Week 4, không mở refactor lan rộng ngoài risk/execution-critical path.
4. Chốt gate W05 bằng evidence thật để mở W06 (Stop-loss coherence).
5. Khóa guardrail chống lỗi biên và rò rỉ dữ liệu: BVA, fail-fast reject, redaction `limit_snapshot`.

Ràng buộc W05:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; chỉ đổi nếu có trigger P0/P1 và `CR-W05-###` hợp lệ.
- Ưu tiên patch nhỏ + adapter, giữ 90-100% codebase hiện hữu.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W05) |
|---|---|
| Change Budget (W05-W08) | `<= 15 files` và `<= 800 LOC net` |
| Compile/Static/Lint/Type | `100% pass` |
| Smoke critical path | `>= 95% pass` |
| Duplicate order rate | `<= 0.1%` |
| Risk breach mới do patch tuần | `= 0` |
| BVA coverage (limit-1/limit/limit+1) | `100%` cho symbol và strategy limits |
| Bridge fail-fast reject ratio | `100%` reject phải bị chặn trước execution layer |
| Latency overhead (risk lookup) | `<= 0.2ms` so với watermark W04 |
| Redaction compliance (`limit_snapshot`) | `100%` log public đã redaction |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |

---

## 2) Task board theo chu kỳ (W5-T01 -> W5-T18)

### Pha 1: Freeze scope & policy

- `W5-T01` Freeze phạm vi Risk Limits v1 (per-symbol/per-strategy).
- `W5-T02` Freeze reject semantics dictionary (`reason_code`, `limit_snapshot`, disposition).
- `W5-T03` Freeze command profile + taxonomy evidence cho W05.

### Pha 2: Baseline capture

- `W5-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W5-T05` Chạy command profile risk-focused, chụp benchmark latency nền và cập nhật matrix `expected/actual`.
- `W5-T06` Chốt baseline cho risk reject path + observability path.

### Pha 3: Implementation rollout

- `W5-T07` Triển khai giới hạn theo symbol (position/value/volume caps) + BVA (`limit-1/limit/limit+1`).
- `W5-T08` Triển khai giới hạn theo strategy (allocation/drawdown/day-loss caps) + BVA (`limit-1/limit/limit+1`).
- `W5-T09` Chuẩn hóa reject semantics bằng enum canonical (`Decision`, `ReasonCode`) + risk-reject ack mapping tới bridge/execution.

### Pha 4: Triage & hardening

- `W5-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W5-T11` Hardening duplicate-order guardrail + fail-fast reject ở bridge (`disposition=REJECT` không đi execution).
- `W5-T12` Đóng toàn bộ blocker P0 và xử lý P1 unowned.

### Pha 5: Closure + rerun

- `W5-T13` Rerun baseline sau rollout để xác nhận không regression.
- `W5-T14` Khóa issue register theo evidence thật.

### Pha 6: Gate rehearsal

- `W5-T15` Đồng bộ Baseline -> Issue Register -> Gate Notes -> Final Report.
- `W5-T16` Rehearsal quyết định `GO/NO-GO` theo rule Phase 2.

### Pha 7: Final closeout

- `W5-T17` Xuất final report W05 với 1 trạng thái gate duy nhất.
- `W5-T18` Chốt Week 6 start pack (stop-loss coherence priorities + guardrails).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- Risk reject path luôn có `correlation_id` + `reason_code` trong log evidence.
- BVA matrix cho symbol/strategy limits được cập nhật tiến độ mỗi ngày.
- Log public không lộ `limit_snapshot` chưa redaction.
- Decision log cuối chu kỳ phản ánh đúng trạng thái runtime.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc.
- Duplicate order rate trên reject path `<= 0.1%`.
- Không có risk breach mới do patch tuần hiện tại.
- Latency overhead risk lookup `<= 0.2ms` so với watermark W04.
- Bridge fail-fast reject ratio = `100%`.
- Không còn P0 open, không có P1 unowned.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W05

### P0

| ID | Issue | Tác động | Điều kiện đóng W05 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W5-ISS-001` | Per-symbol limits chưa enforce nhất quán | Chặn risk gate | Enforce pass theo test matrix symbol caps | `coder` | `Pha 3` |
| `W5-ISS-002` | Per-strategy limits chưa enforce nhất quán | Chặn risk gate | Enforce pass theo strategy caps matrix | `coder` | `Pha 3` |
| `W5-ISS-005` | Duplicate order trên reject path vượt ngưỡng | Rủi ro execution | Duplicate order rate `<=0.1%` | `tester` | `Pha 4` |
| `W5-ISS-006` | Có risk breach mới do patch tuần | Chặn GO | Risk breach mới do patch = 0 | `ops` | `Pha 5` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W05 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W5-ISS-003` | Reject semantics drift giữa risk và execution | Mất nhất quán quyết định | reason_code + limit_snapshot mapping chuẩn | `coder` | `Pha 3` |
| `W5-ISS-004` | Risk-reject ack path chưa đồng bộ ở bridge | Gây nhiễu trace/ack | Risk-reject ack pass cross-runtime path | `coder` | `Pha 3` |
| `W5-ISS-007` | Correlation gap trong reject logging | Khó triage incident | `audit_correlation` = 0 findings | `tester` | `Pha 4` |
| `W5-ISS-008` | Gate artifacts mâu thuẫn trạng thái | Sai governance | Baseline/Issue/Gate/Final cùng 1 quyết định | `planner` | `Pha 6` |
| `W5-ISS-010` | `Decision/ReasonCode` chưa canonical enum | Dễ semantic drift giữa runtime/logging | Enum compile contract pass ở Rust + adapter mapping pass ở Python | `coder` | `Pha 3` |
| `W5-ISS-011` | Bridge chưa fail-fast cho `REJECT` | Rủi ro duplicate order | Reject bị chặn trước execution, có evidence reject-disposition path | `coder` | `Pha 4` |
| `W5-ISS-012` | `limit_snapshot` chưa redaction đầy đủ | Lộ dữ liệu nhạy cảm trong log public | Redaction compliance = 100% | `ops` | `Pha 4` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W05 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W5-ISS-009` | Vượt change budget tuần | Tăng risk regression | Có escalation record hợp lệ hoặc giảm scope | `planner` | `Pha 5` |
| `W5-ISS-013` | Latency overhead do risk state lookup vượt ngưỡng | Giảm hiệu năng critical path | Overhead `<= 0.2ms` hoặc có cache mitigation | `ops` | `Pha 5` |
| `W5-ISS-014` | BVA coverage chưa đủ 100% | Rủi ro lỗi biên off-by-one | BVA đủ `limit-1/limit/limit+1` cho symbol và strategy limits | `tester` | `Pha 3` |

---

## 5) Test plan W05 (risk-limits-focused)

### Command profile chuẩn

```bash
python -m pytest tests/integration/test_backtest_signal_flow.py -q
python -m pytest tests/integration/test_observability_integration.py -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge -p risk-manager -p execution-engine
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
bash scripts/compliance_audit.sh --check-correlation --check-versioning
python scripts/audit_correlation.py --fail-on-findings
```

### Scenario bắt buộc

1. Per-symbol limits: vượt cap phải reject đúng policy.
2. Per-strategy limits: vượt cap phải reject đúng policy.
3. Reject semantics: đủ `decision/reason_code/limit_snapshot`.
4. BVA symbol limits: `limit-1` pass, `limit` pass, `limit+1` reject.
5. BVA strategy limits: `limit-1` pass, `limit` pass, `limit+1` reject.
6. Risk-reject ack path: reject event không tạo duplicate order.
7. Bridge fail-fast: `disposition=REJECT` không đi execution layer.
8. Observability: reject path có `correlation_id` + structured error.
9. Redaction: `limit_snapshot` bị ẩn ở log public theo policy.
10. Performance: overhead risk lookup `<=0.2ms` so với watermark W04.
11. Safety: reject path drop-safe, không panic.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W05)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W05: `EV-W5-###`
- Interface/type change (nếu có) bắt buộc có `CR-W05-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W5-T01..W5-T18`.
4. Issue Register snapshot.
5. Rehearsal results (risk limits/reject semantics/duplicate-order guardrail).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 6 Start Pack.

---

## 7) KPI dictionary W05

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- Duplicate Order Rate on Reject Path.

### Risk Quality

- Per-symbol limit compliance.
- Per-strategy limit compliance.
- Risk breach mới do patch tuần.
- BVA coverage cho limits.
- Latency overhead do risk lookup.

### Contract & Observability

- Reject semantics completeness.
- Enum canonicalization compliance (`Decision`, `ReasonCode`).
- Bridge fail-fast reject ratio.
- Correlation continuity on reject events.
- Redaction compliance cho `limit_snapshot`.
- Correlation audit findings.

### Engineering Quality

- Build/Static Check Profile Stability.
- Change Budget Compliance.
- Regression count sau rerun.

### Governance

- Artifact consistency.
- Evidence completeness.
- Ownership SLA (P1 unowned = 0).

---

## 8) Assumptions & defaults

- W05 là implementation-focused cho Risk Limits v1, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.

---

## 9) Execution artifacts (Week 5)

- [week5/KPI_CHARTER_WEEK5.md](week5/KPI_CHARTER_WEEK5.md)
- [week5/RISK_LIMITS_BASELINE_REPORT.md](week5/RISK_LIMITS_BASELINE_REPORT.md)
- [week5/RISK_LIMITS_IMPLEMENTATION_PLAN.md](week5/RISK_LIMITS_IMPLEMENTATION_PLAN.md)
- [week5/ISSUE_REGISTER_WEEK5.md](week5/ISSUE_REGISTER_WEEK5.md)
- [week5/INTERFACE_RISK_LIMITS_SPEC.md](week5/INTERFACE_RISK_LIMITS_SPEC.md)
- [week5/GATE_REHEARSAL_NOTES.md](week5/GATE_REHEARSAL_NOTES.md)
- [week5/WEEK5_FINAL_REPORT_AND_WEEK6_START_PACK.md](week5/WEEK5_FINAL_REPORT_AND_WEEK6_START_PACK.md)

---

## 10) Execution status (captured)

- `W5-T01..T18`: `DONE` theo sequence `Freeze -> Baseline -> Lane Rollout -> Hardening -> Reconciliation -> Closeout`.
- Command profile: `EV-W5-101..109` đều `CAPTURED_PASS`.
- Scenario/hardening matrix: `EV-W5-201..212`, `EV-W5-301..305` đều `CAPTURED_PASS`.
- Final gate: `GO` (không còn P0 open, không có P1 unowned, artifact one-decision sync).

---
Last updated: 2026-04-23 (W05 implementation completed)
