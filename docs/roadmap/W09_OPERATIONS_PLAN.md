# Kế Hoạch Vận Hành Tuần 9 (W09, Observability Contract)

## 1) Mục tiêu tuần

W09 tập trung triển khai **Observability Contract** theo roadmap 24 tuần:

1. Khóa schema logging/event/metric thống nhất trên critical path Python-Rust.
2. Đảm bảo `correlation_id` continuity trên các event quan trọng: signal, risk decision, stop-loss, circuit breaker, retry/slippage, execution ack và health/alert.
3. Chuẩn hóa severity, reason_code, disposition và component taxonomy để W10 có thể xây SLO/alert profile trên dữ liệu đáng tin.
4. Chuẩn hóa dashboard/metrics/logging evidence mà không thay đổi production behavior chỉ để làm đẹp log.
5. Chốt gate W09 bằng evidence thật để mở W10 API Health & SLO.

Ràng buộc W09:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W09-###`.
- One-ID policy giữ nguyên: chỉ dùng `correlation_id` trong public docs/log/event.
- Ưu tiên adapter/hardening observability nội bộ, giữ 90-100% codebase hiện hữu.
- W09 không được thay đổi production behavior chỉ để làm đẹp log.
- W09 bắt đầu Phase 3: Observability/Ops Readiness, nên correlation coverage target `>=99%`.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W09) |
|---|---|
| Change Budget (W09-W12) | `<= 18 files` và `<= 900 LOC net` |
| Compile/Static/Lint/Type | `100% pass` |
| Smoke critical path | `>= 95% pass` |
| Correlation coverage critical events | `>= 99%` |
| Critical event missing `correlation_id` | `= 0` |
| Schema/version coverage on public events | `>= 99%` |
| Structured log parse success | `>= 99%` |
| Redaction leak count | `= 0` |
| Alert false-positive sample | `<= 15%` nếu alert sample có đủ dữ liệu |
| Alert false-negative critical | `= 0` |
| Dashboard critical panel data availability | `>= 95%` |
| W05-W08 regression guard pass rate | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |

---

## 2) Task board theo chu kỳ (W9-T01 -> W9-T18)

### Pha 1: Freeze scope & observability taxonomy

- `W9-T01` Freeze phạm vi Observability Contract: logging Python, metrics collectors, Rust metrics/health, dashboard evidence, compliance/correlation audits.
- `W9-T02` Freeze event taxonomy: component, severity, reason_code, disposition, event_type, schema_version, correlation_id.
- `W9-T03` Freeze critical event list: Signal, RiskDecision, StopLossTrigger, CircuitBreakerTransition, RetryAttempt, SlippageReject, ExecutionAck, HealthStatus, Alert.
- `W9-T03A` Freeze no-behavior-change rule: observability work không thay đổi execution/risk decisions.

### Pha 2: Baseline capture

- `W9-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W9-T05` Chạy command profile observability-focused, cập nhật matrix `expected/actual`.
- `W9-T06` Capture current gaps: log parseability, correlation continuity, schema_version coverage, redaction, dashboard data availability.

### Pha 3: Contract implementation rollout

- `W9-T07` Lane 1: chuẩn hóa structured logging schema và correlation continuity trên Python observability path.
- `W9-T08` Lane 2: chuẩn hóa Rust metrics/health/event metadata liên quan critical path.
- `W9-T09` Lane 3: chuẩn hóa dashboard/API event consumption để không lệch schema giữa backend và UI.

### Pha 4: Alert/triage hardening

- `W9-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W9-T11` Redaction + payload preview audit: không leak `limit_snapshot`, token/secret, account-sensitive fields.
- `W9-T12` Alert readiness rehearsal: alert sample có severity/reason/source rõ, false-negative critical `=0`.

### Pha 5: Closure + rerun

- `W9-T13` Rerun baseline sau rollout để xác nhận không regression W05-W08.
- `W9-T14` Khóa issue register theo evidence thật, đóng P0/P1 gate-blocking.

### Pha 6: Gate rehearsal

- `W9-T15` Đồng bộ Baseline -> Issue Register -> Gate Notes -> KPI -> Final Report.
- `W9-T16` Rehearsal quyết định `GO/NO-GO` theo Phase 3 gate.

### Pha 7: Final closeout

- `W9-T17` Xuất final report W09 với một trạng thái gate duy nhất.
- `W9-T18` Chốt Week 10 start pack (API Health & SLO priorities + observability guardrails).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- Critical event luôn có `correlation_id`, `component`, `severity`, `event_type`, `timestamp`, `reason_code` hoặc `disposition` khi applicable.
- Correlation coverage và log parseability được cập nhật mỗi ngày.
- Redaction audit phải ghi rõ: pass, fail, hoặc `BLOCKED_ENV`.
- Dashboard/API mismatch phải map về owner backend hoặc frontend rõ ràng.
- Decision log cuối chu kỳ phản ánh đúng evidence runtime.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc đã chạy.
- Correlation coverage critical events `>=99%`.
- Critical missing `correlation_id` count `=0`.
- Structured log parse success `>=99%`.
- Redaction leak count `=0`.
- Alert false-negative critical `=0`.
- Dashboard critical panel availability `>=95%`.
- W05-W08 regression guard pass.
- Không còn P0 open, không có P1 unowned.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W09

### P0

| ID | Issue | Tác động | Điều kiện đóng W09 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W9-ISS-001` | Critical event thiếu `correlation_id` | Không truy vết được incident live | missing critical correlation count `=0` | `ops` | `Pha 3` |
| `W9-ISS-002` | Structured log/event schema không parse được | Alert/dashboard sai dữ liệu | parse success `>=99%` | `coder` | `Pha 3` |
| `W9-ISS-003` | Redaction leak ở logs/events | Rủi ro lộ account/strategy data | redaction leak count `=0` | `ops` | `Pha 4` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W09 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W9-ISS-004` | Severity/reason/disposition taxonomy drift | Alert triage sai | taxonomy matrix pass | `planner` | `Pha 3` |
| `W9-ISS-005` | Metrics/dashboard critical panel thiếu data | Không quan sát được runtime | dashboard availability `>=95%` | `ops` | `Pha 4` |
| `W9-ISS-006` | Alert sample false-negative critical | Bỏ lỡ sự cố P0 | critical false-negative `=0` | `ops` | `Pha 4` |
| `W9-ISS-007` | W05-W08 regression chưa rerun sau obs changes | Regression risk tích lũy | W05-W08 guardrail slices pass | `tester` | `Pha 5` |
| `W9-ISS-008` | Gate artifacts mâu thuẫn trạng thái | Sai governance | Baseline/Issue/Gate/KPI/Final cùng 1 quyết định | `planner` | `Pha 6` |
| `W9-ISS-009` | Backend/API/UI schema drift | Dashboard render sai hoặc drop field | API/dashboard schema checks pass | `coder` | `Pha 3` |
| `W9-ISS-010` | Rust metrics/health thiếu component metadata | Khó map service owner | Rust metrics/health metadata matrix pass | `coder` | `Pha 3` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W09 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W9-ISS-011` | Vượt change budget tuần | Tăng regression risk | Có escalation record hợp lệ hoặc giảm scope | `planner` | `Pha 5` |
| `W9-ISS-012` | Observability overhead chưa đo | Giảm hiệu năng critical path | overhead có watermark hoặc mitigation rõ | `ops` | `Pha 5` |

---

## 5) Test plan W09 (observability-focused)

### Command profile chuẩn

```bash
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

1. Structured logs parse được trên public/runtime log sample.
2. Critical event list có `correlation_id` coverage `>=99%` và missing critical count `=0`.
3. Schema_version coverage trên public events `>=99%`.
4. Severity taxonomy pass: `DEBUG/INFO/WARN/ERROR/CRITICAL` hoặc mapping canonical hiện hành.
5. Reason/disposition taxonomy pass cho risk/execution/observability events.
6. Redaction leak count `=0` cho `limit_snapshot`, token/secret, account-sensitive fields.
7. Rust metrics text expose component/metric labels cần thiết.
8. Observability API routes trả schema ổn định cho metrics/trades/system.
9. Dashboard critical panels có data availability `>=95%` trong test sample.
10. Alert sample không bỏ lỡ critical event.
11. W05-W08 regression slices pass sau W09.
12. Artifact consistency pass.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W09)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W09: `EV-W9-###`
- Interface/type change (nếu có) bắt buộc có `CR-W09-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W9-T01..W9-T18`.
4. Issue Register snapshot.
5. Rehearsal results (correlation coverage, schema parseability, redaction, dashboard/API, alert sample).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 10 Start Pack.

---

## 7) KPI dictionary W09

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- Critical Missing Correlation Count.
- Structured Log Parse Success.
- W05-W08 Regression Guard Pass Rate.

### Observability Quality

- Correlation Coverage.
- Schema Version Coverage.
- Event Metadata Completeness.
- Severity Taxonomy Coverage.
- Reason/Disposition Taxonomy Coverage.
- Redaction Leak Count.
- Dashboard Critical Panel Availability.

### Alert Readiness

- Alert False Positive Sample Rate.
- Alert False Negative Critical Count.
- Alert Context Completeness.

### Performance

- Observability Collection Overhead.
- Log/Event Serialization Latency.
- API Metrics Response Watermark.

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

- W09 là implementation-focused cho Observability Contract, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.
- Nếu cần đổi internal logging/event helper để truyền `correlation_id` hoặc taxonomy context, phải mở `CR-W09-001`; public envelope vẫn không đổi.
- W09 có thể chạy song song với closeout W08 trên tài liệu, nhưng W10 handoff chỉ hợp lệ khi W08 và W09 đều có gate decision rõ.

---

## 9) Execution artifacts (Week 9)

- [week9/KPI_CHARTER_WEEK9.md](week9/KPI_CHARTER_WEEK9.md)
- [week9/OBSERVABILITY_BASELINE_REPORT.md](week9/OBSERVABILITY_BASELINE_REPORT.md)
- [week9/OBSERVABILITY_CONTRACT_IMPLEMENTATION_PLAN.md](week9/OBSERVABILITY_CONTRACT_IMPLEMENTATION_PLAN.md)
- [week9/ISSUE_REGISTER_WEEK9.md](week9/ISSUE_REGISTER_WEEK9.md)
- [week9/INTERFACE_OBSERVABILITY_CONTRACT_SPEC.md](week9/INTERFACE_OBSERVABILITY_CONTRACT_SPEC.md)
- [week9/GATE_REHEARSAL_NOTES.md](week9/GATE_REHEARSAL_NOTES.md)
- [week9/WEEK9_FINAL_REPORT_AND_WEEK10_START_PACK.md](week9/WEEK9_FINAL_REPORT_AND_WEEK10_START_PACK.md)

---

## 10) Execution status (initial)

- `W9-T01..T18`: `PENDING_EXECUTION`.
- Command profile: `PENDING_EXECUTION`.
- Scenario/hardening matrix: `PENDING_EXECUTION`.
- Final gate: `PENDING_DECISION` cho đến khi đủ evidence thật.
