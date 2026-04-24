# Kế Hoạch Vận Hành Tuần 11 (W11, Incident Runbook)

## 1) Mục tiêu tuần

W11 tập trung triển khai **Incident Runbook** theo roadmap 24 tuần:

1. Chuẩn hóa response flow P0/P1 dựa trên alert profile W10 và taxonomy W09.
2. Khóa escalation matrix: severity, owner, acknowledgement SLA, mitigation ETA, evidence và closeout rule.
3. Drill các scenario vận hành bắt buộc: API degraded, execution alert, circuit breaker alert, stale WebSocket stream và position/risk breach.
4. Đảm bảo incident timeline có đủ chuỗi: alert -> acknowledge -> triage -> mitigation -> verify -> closeout -> postmortem.
5. Chốt gate W11 bằng evidence thật để mở W12 Ops Readiness Gate.

Ràng buộc W11:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W11-###`.
- One-ID policy giữ nguyên: chỉ dùng `correlation_id` trong public docs/log/event.
- W11 phải reuse W09 observability taxonomy và W10 alert/SLO profile.
- Incident không được ghi `RESOLVED` nếu chưa có evidence closeout.
- W11 không thay đổi trading/risk/execution behavior, chỉ chuẩn hóa runbook, drill, escalation và evidence.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W11) |
|---|---|
| Change Budget (W09-W12) | `<= 18 files` và `<= 900 LOC net` |
| Compile/Static/Lint/Type | `100% pass` |
| Smoke critical path | `>= 95% pass` |
| Correlation coverage critical events | `>= 99%` |
| Alert false-positive sample | `<= 15%` |
| Alert false-negative critical | `= 0` |
| P0 acknowledgement SLA | `<= 5 minutes` |
| P1 acknowledgement SLA | `<= 15 minutes` |
| P0 mitigation owner assignment | `<= 10 minutes` |
| P1 mitigation owner assignment | `<= 30 minutes` |
| Required drill completion | `100%` scenario bắt buộc |
| Incident closeout evidence completeness | `100%` |
| Post-incident review template coverage | `100%` P0/P1 |
| W05-W10 regression guard pass rate | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |

---

## 2) Task board theo chu kỳ (W11-T01 -> W11-T18)

### Pha 1: Freeze scope & incident taxonomy

- `W11-T01` Freeze phạm vi Incident Runbook: severity P0/P1, escalation matrix, incident evidence, postmortem template và runbook drills.
- `W11-T02` Freeze P0/P1 SLA dictionary: acknowledge, owner assignment, mitigation ETA, closeout và postmortem due.
- `W11-T03` Freeze incident taxonomy reuse từ W09/W10: severity, reason_code, component, source_event_id, alert_id và correlation context.
- `W11-T03A` Freeze no-behavior-change rule: runbook work không thay đổi trading/risk/execution decisions.

### Pha 2: Baseline capture

- `W11-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W11-T05` Chạy command profile incident-runbook-focused, cập nhật matrix `expected/actual`.
- `W11-T06` Capture current gaps: runbook completeness, escalation owner/SLA, drill readiness, closeout evidence và postmortem template.

### Pha 3: Runbook implementation rollout

- `W11-T07` Lane 1: chuẩn hóa severity/escalation matrix, owner mặc định, acknowledgement SLA và escalation ladder.
- `W11-T08` Lane 2: chuẩn hóa P0/P1 playbooks cho API degraded, execution alert, circuit breaker alert, stale WebSocket stream và position/risk breach.
- `W11-T09` Lane 3: chuẩn hóa incident evidence pack, closeout rule và postmortem template.

### Pha 4: Drill rehearsal & triage hardening

- `W11-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W11-T11` Drill incident flow: alert -> acknowledge -> triage -> mitigation -> verify -> closeout.
- `W11-T12` Drill escalation flow: P0/P1 acknowledgement đúng SLA, owner assignment đúng SLA, postmortem due được tạo.

### Pha 5: Closure + rerun

- `W11-T13` Rerun baseline sau rollout để xác nhận không regression W05-W10.
- `W11-T14` Khóa issue register theo evidence thật, đóng P0/P1 gate-blocking.

### Pha 6: Gate rehearsal

- `W11-T15` Đồng bộ Baseline -> Issue Register -> Gate Notes -> KPI -> Final Report.
- `W11-T16` Rehearsal quyết định `GO/NO-GO` theo Phase 3 gate.

### Pha 7: Final closeout

- `W11-T17` Xuất final report W11 với một trạng thái gate duy nhất.
- `W11-T18` Chốt Week 12 start pack (Ops Readiness Gate priorities + readiness guardrails).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- Mọi incident drill phải ghi `alert_id`, severity, component, owner, acknowledgement time, mitigation action và evidence_id.
- P0/P1 acknowledgement phải được đo bằng timestamp, không ghi bằng mô tả cảm tính.
- Runbook closeout phải có verify step và evidence; không ghi `RESOLVED` nếu thiếu verify.
- Postmortem template phải được tạo cho mọi P0/P1 drill hoặc incident thật.
- Decision log cuối chu kỳ phản ánh đúng evidence runtime/drill.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc đã chạy.
- P0 acknowledgement SLA `<=5 minutes`.
- P1 acknowledgement SLA `<=15 minutes`.
- P0 mitigation owner assignment `<=10 minutes`.
- P1 mitigation owner assignment `<=30 minutes`.
- Required drill completion `100%`.
- Incident closeout evidence completeness `100%`.
- Alert false-negative critical `=0`.
- W05-W10 regression guard pass.
- Không còn P0 open, không có P1 unowned.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W11

### P0

| ID | Issue | Tác động | Điều kiện đóng W11 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W11-ISS-001` | Incident closeout thiếu evidence verify | Có thể đánh dấu resolved giả | closeout evidence completeness `100%` | `ops` | `Pha 3` |
| `W11-ISS-002` | Escalation matrix thiếu owner/SLA rõ | Incident thật không ai nhận xử lý | owner/SLA matrix complete | `planner` | `Pha 1` |
| `W11-ISS-003` | Critical alert drill miss hoặc acknowledge trễ | Bỏ lỡ P0 live/safety | P0 ack `<=5m`, false-negative critical `=0` | `ops` | `Pha 4` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W11 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W11-ISS-004` | P0/P1 severity taxonomy drift | Triage sai mức độ | severity taxonomy matrix pass | `planner` | `Pha 1` |
| `W11-ISS-005` | API degraded drill thiếu hoặc chưa đo SLA | W12 readiness thiếu evidence | API degraded drill pass | `ops` | `Pha 4` |
| `W11-ISS-006` | Execution alert drill thiếu hoặc chưa đo duplicate/latency context | Không phân biệt execution/risk incident | execution alert drill pass | `ops` | `Pha 4` |
| `W11-ISS-007` | Circuit breaker drill thiếu reset/approval step | Risk-off recovery không an toàn | circuit breaker drill pass | `ops` | `Pha 4` |
| `W11-ISS-008` | Stale WebSocket stream drill thiếu reconnect/verify step | Market data outage khó phát hiện | stale stream drill pass | `coder` | `Pha 4` |
| `W11-ISS-009` | W05-W10 regression chưa rerun sau runbook updates | Regression risk tích lũy | W05-W10 guardrail slices pass | `tester` | `Pha 5` |
| `W11-ISS-010` | Gate artifacts mâu thuẫn trạng thái | Sai governance | Baseline/Issue/Gate/KPI/Final cùng 1 quyết định | `planner` | `Pha 6` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W11 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W11-ISS-011` | Vượt change budget tuần | Tăng regression risk | Có escalation record hợp lệ hoặc giảm scope | `planner` | `Pha 5` |
| `W11-ISS-012` | Manual toil của runbook chưa đo | Ops quá tải khi incident thật | toil/step count có watermark hoặc mitigation | `ops` | `Pha 5` |

---

## 5) Test plan W11 (incident-runbook-focused)

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

1. P0 circuit breaker incident drill: alert, acknowledgement, approval/reset decision, verify và closeout.
2. API degraded drill: health/SLO alert, owner assignment, mitigation và verify endpoint recovered/degraded state đúng.
3. Execution alert drill: high latency/failed order alert, triage risk-vs-execution owner, mitigation và duplicate side-effect check.
4. Stale WebSocket stream drill: stale detection, reconnect action, verify stream cadence/heartbeat.
5. Position/risk breach drill: risk alert, stop-loss/circuit breaker context, mitigation owner và closeout evidence.
6. Escalation matrix validation: owner + backup owner + acknowledgement SLA + mitigation ETA đầy đủ.
7. Incident timeline validation: alert -> acknowledge -> triage -> mitigation -> verify -> closeout -> postmortem.
8. Closeout evidence validation: không có incident nào `RESOLVED` khi thiếu verify evidence.
9. Postmortem template validation: P0/P1 đều có root cause, impact, action item, owner, due và evidence.
10. W05-W10 regression slices pass sau W11 docs/runbook changes.
11. Correlation audit `0 findings`.
12. Artifact consistency pass.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W11)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W11: `EV-W11-###`
- Interface/type change (nếu có) bắt buộc có `CR-W11-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W11-T01..W11-T18`.
4. Issue Register snapshot.
5. Rehearsal results (P0/P1 SLA, drill completion, closeout evidence, postmortem, regression).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 12 Start Pack.

---

## 7) KPI dictionary W11

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- P1 Unowned Count.
- W05-W10 Regression Guard Pass Rate.

### Incident Response

- P0 Acknowledgement Time.
- P1 Acknowledgement Time.
- P0 Mitigation Owner Assignment Time.
- P1 Mitigation Owner Assignment Time.
- Required Drill Completion Rate.
- Incident Closeout Evidence Completeness.

### Alert & Triage Quality

- Critical Alert False Negative Count.
- Alert False Positive Sample Rate.
- Severity Taxonomy Accuracy.
- Escalation Matrix Completeness.
- Triage Cluster Assignment Accuracy.

### Observability & Evidence

- Correlation Coverage.
- Incident Timeline Completeness.
- Postmortem Template Coverage.
- Evidence ID Completeness.

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

- W11 là ops-readiness/documentation-focused cho Incident Runbook, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.
- Nếu cần đổi incident data model hoặc alert acknowledgement behavior, phải mở `CR-W11-001`; public envelope vẫn không đổi.
- W12 handoff chỉ hợp lệ khi W11 có gate decision rõ.
