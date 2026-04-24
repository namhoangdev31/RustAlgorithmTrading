# Kế Hoạch Vận Hành Tuần 8 (W08, Execution Retry/Slippage)

## 1) Mục tiêu tuần

W08 tập trung triển khai **Execution Retry/Slippage Hardening** theo roadmap 24 tuần:

1. Khóa retry policy để không tạo duplicate order, không retry sai loại lỗi và không bypass risk-off từ W07.
2. Khóa slippage guardrails để mọi order trước khi route có validation nhất quán, không NaN/Inf, không vượt `max_slippage_bps`.
3. Đồng bộ retry/slippage với W05 Risk Limits, W06 Stop-loss Coherence và W07 Circuit Breaker Hardening.
4. Chuẩn hóa observability cho execution attempt: mọi retry/reject/guard event giữ `correlation_id`, reason/disposition và attempt metadata.
5. Chốt gate W08 bằng evidence thật để mở W09 Observability Contract mà không mang theo rủi ro duplicate/retry mơ hồ.

Ràng buộc W08:

- Giữ contract canonical đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không đổi public wire-shape mặc định; mọi đổi interface/type phải có `CR-W08-###`.
- Ưu tiên adapter/hardening nội bộ, giữ 90-100% codebase hiện hữu.
- One-ID policy giữ nguyên: chỉ dùng `correlation_id` trong public docs/log/event.
- Retry không được bypass breaker state `OPEN` hoặc `RESET_PENDING`.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W08) |
|---|---|
| Change Budget (W05-W08) | `<= 15 files` và `<= 800 LOC net` |
| Compile/Static/Lint/Type | `100% pass` |
| Smoke critical path | `>= 95% pass` |
| Duplicate order rate ở retry path | `<= 0.1%` |
| Duplicate client order id trong retry cùng order | `= 0` |
| Retry non-retryable error count | `= 0` |
| Risk-off bypass count | `= 0` |
| Slippage NaN/Inf acceptance | `= 0` |
| Slippage max-bps breach allowed | `= 0` |
| W05/W06/W07 regression guard pass rate | `100%` |
| Execution event correlation continuity | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |

---

## 2) Task board theo chu kỳ (W8-T01 -> W8-T18)

### Pha 1: Freeze scope & execution semantics

- `W8-T01` Freeze phạm vi Execution Retry/Slippage: `rust/execution-engine`, retry/slippage tests, execution metrics/logging và W07 circuit-breaker interaction.
- `W8-T02` Freeze retry taxonomy: retryable lỗi mạng/tạm thời; non-retryable risk-off, validation, slippage breach, auth/config.
- `W8-T03` Freeze idempotency policy: cùng `client_order_id` cho cùng logical order, không tạo duplicate side-effect trong retry.
- `W8-T03A` Freeze slippage policy: invalid market/limit price reject có kiểm soát; NaN/Inf không được route.

### Pha 2: Baseline capture

- `W8-T04` Chạy clean-slate preflight và ghi evidence nền.
- `W8-T05` Chạy command profile execution-focused, cập nhật matrix `expected/actual`.
- `W8-T06` Chốt baseline hiện tại cho retry, slippage, order router, stop-loss execution và observability path.

### Pha 3: Implementation rollout

- `W8-T07` Lane 1: retry classification + backoff guardrail, chỉ retry lỗi retryable (Bao gồm rẽ nhánh Fallback: Unknown Error = Non-retryable).
- `W8-T08` Lane 2: idempotency guard, replay cùng order không đổi `client_order_id` (Bổ sung In-memory Idempotency Lock để chặn duplicate submit do race condition lưới mạng).
- `W8-T08A` Lane 2.1: Bắn Async Telemetry cho Metrics và Logging để triệt tiêu overhead trên critical path.
- `W8-T09` Lane 3: slippage guardrail, boundary/NaN/Inf/max-bps tests và route reject trước exchange.

### Pha 4: Resilience + regression hardening

- `W8-T10` Triage mismatch theo cụm A/B/C, gán owner/ETA/mitigation.
- `W8-T11` Hardening W07 interaction: retry check breaker/risk-off trước mỗi attempt (Bổ sung logic check `CB.is_open` ngay lập tức TRƯỚC KHI request sàn, ngay SAU vòng lặp sleep backoff).
- `W8-T12` Stress replay scenario: repeated transient failures, partial success, timeout và non-retryable reject không flapping/duplicate.

### Pha 5: Closure + rerun

- `W8-T13` Rerun baseline sau rollout để xác nhận không regression W05/W06/W07.
- `W8-T14` Khóa issue register theo evidence thật, đóng P0/P1 gate-blocking.

### Pha 6: Gate rehearsal

- `W8-T15` Đồng bộ Baseline -> Issue Register -> Gate Notes -> Final Report.
- `W8-T16` Rehearsal quyết định `GO/NO-GO` theo Phase 2 gate.

### Pha 7: Final closeout

- `W8-T17` Xuất final report W08 với một trạng thái gate duy nhất.
- `W8-T18` Chốt Week 9 start pack (observability contract priorities + execution event guardrails).

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Có ít nhất 1 dòng evidence được cập nhật từ `PENDING_EXECUTION` sang trạng thái thực.
- Mismatch mới được map issue trong 24h, có owner + ETA + mitigation.
- Không để P0 ở trạng thái `NEW/IN_PROGRESS` qua chu kỳ kế tiếp.
- Retry/slippage event luôn có `correlation_id`, attempt, reason_code, disposition trong evidence.
- Retry classification matrix được cập nhật tiến độ mỗi ngày.
- Slippage boundary behavior phải ghi rõ: pass, fail, hoặc `BLOCKED_ENV`.
- Duplicate side-effect risk được kiểm tra sau mỗi lane.
- Decision log cuối chu kỳ phản ánh đúng trạng thái runtime.

### Checklist cuối tuần

- Baseline matrix không còn placeholder cho mục bắt buộc đã chạy.
- Retry classification matrix = `100%` mandatory scenarios.
- Duplicate order rate `<=0.1%`.
- Retry non-retryable error count `=0`.
- Slippage invalid/NaN/Inf acceptance `=0`.
- Risk-off bypass count `=0`.
- Correlation continuity = `100%`.
- Không còn P0 open, không có P1 unowned.
- Gate artifacts không mâu thuẫn `GO/NO-GO`.

---

## 4) Issue tồn đọng khởi tạo W08

### P0

| ID | Issue | Tác động | Điều kiện đóng W08 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W8-ISS-001` | Retry có thể tạo duplicate order/duplicate side-effect | Rủi ro live-loss trực tiếp | duplicate order rate `<=0.1%`; client order id stable | `coder` | `Pha 3` |
| `W8-ISS-002` | Retry có thể bypass breaker `OPEN/RESET_PENDING` | Bypass safety W07 | risk-off bypass count `=0` | `coder` | `Pha 4` |
| `W8-ISS-003` | Slippage breach vẫn route tới exchange | Rủi ro fill ngoài guardrail | max-bps breach reject trước exchange | `coder` | `Pha 3` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W08 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W8-ISS-004` | Retry classification chưa rõ retryable/non-retryable | Retry sai lỗi auth/risk/validation | classification matrix pass | `coder` | `Pha 3` |
| `W8-ISS-005` | Retry logs còn thiếu `correlation_id` thực | Khó audit execution incident | correlation audit + event metadata pass | `ops` | `Pha 4` |
| `W8-ISS-006` | Slippage NaN/Inf/zero price edge case chưa đủ coverage | Crash hoặc route sai | boundary tests pass | `tester` | `Pha 3` |
| `W8-ISS-007` | W05/W06/W07 regression chưa được rerun sau retry changes | Regression risk tích lũy | W05/W06/W07 guardrail slices pass | `tester` | `Pha 5` |
| `W8-ISS-008` | Gate artifacts mâu thuẫn trạng thái | Sai governance | Baseline/Issue/Gate/KPI/Final cùng 1 quyết định | `planner` | `Pha 6` |
| `W8-ISS-009` | Execution metrics thiếu attempt/retry/slippage outcome | Dashboard/triage yếu | metrics audit pass | `ops` | `Pha 4` |
| `W8-ISS-010` | Slippage estimator warning/noise chưa được triage | CI/log noise che lỗi thật | warning triage hoặc watch item rõ | `coder` | `Pha 5` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W08 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W8-ISS-011` | Vượt change budget tuần | Tăng regression risk | Có escalation record hợp lệ hoặc giảm scope | `planner` | `Pha 5` |
| `W8-ISS-012` | Retry/slippage latency overhead chưa đo | Giảm hiệu năng critical path | overhead có watermark hoặc mitigation rõ | `ops` | `Pha 5` |

---

## 5) Test plan W08 (execution-focused)

### Command profile chuẩn

```bash
python -m pytest tests/integration/test_backtest_signal_flow.py -q
python -m pytest tests/integration/test_observability_integration.py -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p execution-engine
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p execution-engine -p risk-manager
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
bash scripts/compliance_audit.sh --check-correlation --check-versioning
python scripts/audit_correlation.py --fail-on-findings
```

### Scenario bắt buộc

1. Retry success sau transient failure giữ cùng logical order identity.
2. Retry max attempts dừng đúng ngưỡng, không submit quá số lần cho phép.
3. Non-retryable risk/validation/config/slippage error không retry.
4. Breaker `OPEN/RESET_PENDING` block retry trước execution.
5. Same `client_order_id` không tạo duplicate order side-effect.
6. Slippage valid market/limit order pass nếu trong ngưỡng.
7. Slippage breach reject trước exchange.
8. Zero/negative/NaN/Inf market price reject có kiểm soát.
9. Stop-loss close order không bị retry thành duplicate close.
10. Execution event/log/metric có `correlation_id`, attempt, reason_code, disposition.
11. Stress repeated transient failures không flapping/duplicate.
12. W05/W06/W07 regression slices pass sau W08.
13. Thêm: `Idempotency lock` ngăn được 2 luồng đồng thời gọi thực thi.
14. Thêm: Unknown/Unclassified Error mặc định rẽ nhánh về Non-retryable.
15. Thêm: Check Circuit Breaker ngay trong vòng lặp backoff sleep có tác dụng chặn order.

### Rule test ownership

1. Test phản ánh hành vi codebase hiện tại.
2. Khi thay đổi hợp lệ theo spec, test cập nhật cùng tuần và có evidence.
3. Cấm sửa production code chỉ để chiều test lỗi thời.

## 5.1) Gate Checklist (Nhịp W08)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W08: `EV-W8-###`
- Interface/type change (nếu có) bắt buộc có `CR-W08-###`.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W8-T01..W8-T18`.
4. Issue Register snapshot.
5. Rehearsal results (retry classification, duplicate side-effect, slippage boundary, W07 guardrail).
6. Final Gate Decision (`GO/NO-GO`) với evidence.
7. Week 9 Start Pack.

---

## 7) KPI dictionary W08

### Reliability

- Critical Path Smoke Pass Rate.
- P0 Open Count.
- Duplicate Order Rate.
- Retry Non-retryable Count.
- Risk-off Bypass Count.

### Execution Quality

- Retry Classification Coverage.
- Retry Attempt Bound Correctness.
- Client Order ID Stability.
- Slippage Boundary Coverage.
- Slippage Breach Rejection Correctness.
- W05/W06/W07 Regression Guard Pass Rate.

### Contract & Observability

- Execution Event Metadata Completeness.
- Correlation Continuity on Execution Events.
- Structured Error Completeness.
- Metric Scrape Completeness.

### Performance

- Retry Policy Overhead.
- Slippage Estimation Latency.
- Order Route Latency Watermark.

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

- W08 là implementation-focused cho Execution Retry/Slippage, không mở refactor lớn.
- One-ID policy giữ nguyên: `correlation_id`.
- Không đổi wire-shape công khai nếu không có trigger P0/P1 risk.
- Không ghi `Done/Pass/GO` khi thiếu evidence ID hợp lệ.
- Nếu một mục bắt buộc fail ở rerun cuối: giữ `NO-GO` + recovery queue có owner/ETA.
- Nếu cần đổi internal retry API để truyền `correlation_id` hoặc retry classification context, phải mở `CR-W08-001`; public envelope vẫn không đổi.

---

## 9) Execution artifacts (Week 8)

- [week8/KPI_CHARTER_WEEK8.md](week8/KPI_CHARTER_WEEK8.md)
- [week8/EXECUTION_RETRY_SLIPPAGE_BASELINE_REPORT.md](week8/EXECUTION_RETRY_SLIPPAGE_BASELINE_REPORT.md)
- [week8/RETRY_SLIPPAGE_IMPLEMENTATION_PLAN.md](week8/RETRY_SLIPPAGE_IMPLEMENTATION_PLAN.md)
- [week8/ISSUE_REGISTER_WEEK8.md](week8/ISSUE_REGISTER_WEEK8.md)
- [week8/INTERFACE_RETRY_SLIPPAGE_SPEC.md](week8/INTERFACE_RETRY_SLIPPAGE_SPEC.md)
- [week8/GATE_REHEARSAL_NOTES.md](week8/GATE_REHEARSAL_NOTES.md)
- [week8/WEEK8_FINAL_REPORT_AND_WEEK9_START_PACK.md](week8/WEEK8_FINAL_REPORT_AND_WEEK9_START_PACK.md)

---

## 10) Execution status (current)

- `W8-T01..T18`: `DONE`.
- Command profile: `CAPTURED_PASS`.
- Scenario/hardening matrix: `CAPTURED_PASS`.
- Final gate: `GO`.
