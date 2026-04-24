# Kế Hoạch Vận Hành Tuần 10 (W10, API Health & SLO)

## 1) Mục tiêu tuần

W10 tập trung triển khai **API Health & SLO** theo roadmap 24 tuần:

1. Khóa SLO cho Observability API, health/readiness/liveness endpoints, WebSocket metrics stream và component health.
2. Chuẩn hóa alert profile dựa trên taxonomy W09: severity, reason_code, component, source_event_id và `correlation_id` khi event scoped.
3. Đo và ghi evidence cho API latency, readiness accuracy, event-to-alert latency, alert false-positive và critical false-negative.
4. Đảm bảo dashboard SLO panels có dữ liệu đủ để W11 Incident Runbook dùng được.
5. Chốt gate W10 bằng evidence thật để mở W11 Incident Runbook.

Ràng buộc W10:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W10-###`.
- One-ID policy giữ nguyên: chỉ dùng `correlation_id` trong public docs/log/event.
- W10 phải reuse W09 observability taxonomy; không tạo schema alert riêng biệt.
- Alerting không được tạo spam alert để đạt coverage giả.
- W10 không thay đổi trading/risk/execution behavior, chỉ hardening health/SLO/alert/observability path.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W10) |
|---|---|
| Change Budget (W09-W12) | `<= 18 files` và `<= 900 LOC net` |
| Compile/Static/Lint/Type | `100% pass` |
| Smoke critical path | `>= 95% pass` |
| Correlation coverage critical events | `>= 99%` |
| Alert false-positive sample | `<= 15%` |
| Alert false-negative critical | `= 0` |
| `/health` p95 latency | `<= 100ms` local/test profile |
| `/health/ready` correctness | `100%` expected ready/not-ready scenarios |
| `/health/live` correctness | `100%` expected live scenarios |
| `/api/system/health` p95 latency | `<= 250ms` local/test profile |
| WebSocket heartbeat success | `>= 99%` sample or no missed heartbeat in test slice |
| Event-to-alert latency | `<= 120s` temporary W10 target |
| Dashboard SLO panel availability | `>= 95%` |
| W05-W09 regression guard pass rate | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |

---

## 2) Task board theo chu kỳ (W10-T01 -> W10-T18)

### Pha 1: Freeze scope & SLO taxonomy

- `W10-T01` Freeze phạm vi API Health & SLO: Observability API, system routes, health endpoints, WebSocket heartbeat, alert profile, dashboard SLO panels.
- `W10-T02` Freeze SLO dictionary: latency, availability, readiness accuracy, liveness accuracy, alert quality, event-to-alert latency.
- `W10-T03` Freeze alert taxonomy reuse từ W09: severity, reason_code, component, source_event_id, correlation context.
- `W10-T03A` Freeze no-behavior-change rule: SLO/alert work không thay đổi trading decisions.

### Pha 2: Baseline capture

- `W10-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W10-T05` Chạy command profile API/SLO-focused, cập nhật matrix `expected/actual`.
- `W10-T06` Capture current gaps: endpoint latency, readiness/live correctness, alert quality, dashboard SLO availability.

### Pha 3: SLO implementation rollout

- `W10-T07` Lane 1: health/readiness/liveness SLO hardening, response schema và latency evidence.
- `W10-T08` Lane 2: component health + system route SLO, ensure degraded/unknown states có reason rõ.
- `W10-T09` Lane 3: WebSocket heartbeat + metrics stream SLO, detect stale stream/drop-safe behavior.

### Pha 4: Alert profile & dashboard hardening

- `W10-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W10-T11` Alert profile rehearsal: false-positive sample `<=15%`, critical false-negative `=0`.
- `W10-T12` Dashboard SLO panel validation: API health, component status, event-to-alert latency, alert quality.

### Pha 5: Closure + rerun

- `W10-T13` Rerun baseline sau rollout để xác nhận không regression W05-W09.
- `W10-T14` Khóa issue register theo evidence thật, đóng P0/P1 gate-blocking.

### Pha 6: Gate rehearsal

- `W10-T15` Đồng bộ Baseline -> Issue Register -> Gate Notes -> KPI -> Final Report.
- `W10-T16` Rehearsal quyết định `GO/NO-GO` theo Phase 3 gate.

### Pha 7: Final closeout

- `W10-T17` Xuất final report W10 với một trạng thái gate duy nhất.
- `W10-T18` Chốt Week 11 start pack (Incident Runbook priorities + alert escalation guardrails).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- Health/SLO evidence luôn có endpoint, expected, actual, status, evidence_id.
- Alert sample phải ghi false-positive/false-negative method, sample size và limitation.
- Dashboard SLO panel phải ghi rõ data source và owner nếu thiếu dữ liệu.
- Không đổi production behavior để làm đẹp SLO/alert.
- Decision log cuối chu kỳ phản ánh đúng evidence runtime.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc đã chạy.
- `/health`, `/health/ready`, `/health/live`, `/api/system/health` có latency/correctness evidence.
- Alert false-positive sample `<=15%` hoặc có `BLOCKED_ENV` rõ nếu không đủ sample.
- Critical false-negative `=0`.
- Event-to-alert latency `<=120s` hoặc có mitigation rõ.
- Dashboard SLO panel availability `>=95%`.
- W05-W09 regression guard pass.
- Không còn P0 open, không có P1 unowned.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W10

### P0

| ID | Issue | Tác động | Điều kiện đóng W10 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W10-ISS-001` | Critical alert false-negative | Bỏ lỡ sự cố live/safety | critical false-negative `=0` | `ops` | `Pha 4` |
| `W10-ISS-002` | Readiness/liveness trả sai trạng thái | Orchestrator route traffic sai | ready/live correctness `100%` | `coder` | `Pha 3` |
| `W10-ISS-003` | Health/SLO endpoint không có evidence latency | Không thể chốt SLO | latency matrix captured | `tester` | `Pha 2` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W10 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W10-ISS-004` | Alert false-positive vượt ngưỡng | Alert fatigue | false-positive sample `<=15%` hoặc mitigation | `ops` | `Pha 4` |
| `W10-ISS-005` | Event-to-alert latency chưa đo | Không biết alert có kịp không | event-to-alert latency `<=120s` hoặc blocker rõ | `ops` | `Pha 4` |
| `W10-ISS-006` | Dashboard SLO panels thiếu data | Ops không quan sát được SLO | panel availability `>=95%` | `ops` | `Pha 4` |
| `W10-ISS-007` | W05-W09 regression chưa rerun sau SLO changes | Regression risk tích lũy | W05-W09 guardrail slices pass | `tester` | `Pha 5` |
| `W10-ISS-008` | Gate artifacts mâu thuẫn trạng thái | Sai governance | Baseline/Issue/Gate/KPI/Final cùng 1 quyết định | `planner` | `Pha 6` |
| `W10-ISS-009` | API/system route schema drift | Dashboard/runbook parse sai | API schema checks pass | `coder` | `Pha 3` |
| `W10-ISS-010` | WebSocket heartbeat/stream stale không detect | Dashboard realtime sai | heartbeat success `>=99%` hoặc no missed heartbeat in slice | `coder` | `Pha 3` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W10 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W10-ISS-011` | Vượt change budget tuần | Tăng regression risk | Có escalation record hợp lệ hoặc giảm scope | `planner` | `Pha 5` |
| `W10-ISS-012` | SLO instrumentation overhead chưa đo | Giảm hiệu năng API/stream | overhead có watermark hoặc mitigation rõ | `ops` | `Pha 5` |

---

## 5) Test plan W10 (API-health/SLO-focused)

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

1. `/health` returns healthy and p95 latency `<=100ms` in local/test profile.
2. `/health/ready` returns `200` when collectors ready and `503` when not ready.
3. `/health/live` reflects process running state and includes connection/uptime context.
4. `/api/system/health` returns stable schema and p95 latency `<=250ms`.
5. `/api/system/components` includes component statuses and degraded state reason.
6. `/api/system/alerts/acknowledge/{alert_id}` returns structured acknowledgement.
7. WebSocket ping/pong heartbeat succeeds and stream cadence remains within tolerance.
8. Alert false-positive sample `<=15%` if sample exists.
9. Critical false-negative count `=0`.
10. Event-to-alert latency `<=120s` temporary W10 target.
11. Dashboard SLO panel data availability `>=95%`.
12. W05-W09 regression slices pass after W10.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W10)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W10: `EV-W10-###`
- Interface/type change (nếu có) bắt buộc có `CR-W10-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W10-T01..W10-T18`.
4. Issue Register snapshot.
5. Rehearsal results (health latency, readiness/liveness, alert quality, dashboard SLO, regression).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 11 Start Pack.

---

## 7) KPI dictionary W10

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- Readiness Correctness.
- Liveness Correctness.
- WebSocket Heartbeat Success.
- W05-W09 Regression Guard Pass Rate.

### API Health & SLO

- `/health` p95 latency.
- `/health/ready` correctness.
- `/health/live` correctness.
- `/api/system/health` p95 latency.
- Component Health Completeness.
- Event-to-alert latency.

### Alert Quality

- Alert False Positive Sample Rate.
- Alert False Negative Critical Count.
- Alert Context Completeness.
- Alert Acknowledgement Success.

### Dashboard & Observability

- Dashboard SLO Panel Availability.
- Correlation Coverage.
- Schema Version Coverage.
- Redaction Leak Count.

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

- W10 là implementation-focused cho API Health & SLO, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.
- Nếu cần đổi API response shape hoặc alert schema để phục vụ SLO, phải mở `CR-W10-001`; ưu tiên adapter/compatibility trước.
- W10 handoff sang W11 chỉ hợp lệ khi W09/W10 đều có gate decision rõ.

---

## 9) Execution artifacts (Week 10)

- [week10/KPI_CHARTER_WEEK10.md](week10/KPI_CHARTER_WEEK10.md)
- [week10/API_HEALTH_SLO_BASELINE_REPORT.md](week10/API_HEALTH_SLO_BASELINE_REPORT.md)
- [week10/API_HEALTH_SLO_IMPLEMENTATION_PLAN.md](week10/API_HEALTH_SLO_IMPLEMENTATION_PLAN.md)
- [week10/ISSUE_REGISTER_WEEK10.md](week10/ISSUE_REGISTER_WEEK10.md)
- [week10/INTERFACE_API_HEALTH_SLO_SPEC.md](week10/INTERFACE_API_HEALTH_SLO_SPEC.md)
- [week10/GATE_REHEARSAL_NOTES.md](week10/GATE_REHEARSAL_NOTES.md)
- [week10/WEEK10_FINAL_REPORT_AND_WEEK11_START_PACK.md](week10/WEEK10_FINAL_REPORT_AND_WEEK11_START_PACK.md)

---

## 10) Execution status (initial)

- `W10-T01..T18`: `PENDING_EXECUTION`.
- Command profile: `PENDING_EXECUTION`.
- Scenario/hardening matrix: `PENDING_EXECUTION`.
- Final gate: `PENDING_DECISION` cho đến khi đủ evidence thật.
