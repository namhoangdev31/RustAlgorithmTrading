# Kế Hoạch Vận Hành Tuần 3 (One-pass Contract Cutover)

## 1) Mục tiêu

Tuần 3 là tuần triển khai code trọng tâm theo mô hình **one-pass cutover**:

1. Triển khai một chuẩn contract thống nhất Python-Rust trong một đợt, có `schema_version` cố định trên wire.
2. Xóa drift giữa bridge, risk, execution, observability mà không mở rộng refactor ngoài critical path.
3. Khóa nền tảng cho 21 tuần tiếp theo bằng zero-panic parser policy, trace audit tự động, và performance watermark E2E.

## 2) Nguyên tắc chống rối (bắt buộc)

1. Một chuẩn contract duy nhất trên wire, không chạy song song nhiều format công khai.
2. Một chuẩn ID duy nhất: `correlation_id` xuyên suốt logs/events.
3. `schema_version` bắt buộc trong envelope để khóa contract hiện hành (`v1.0.0`) và ngăn drift âm thầm.
4. Một chuẩn xử lý lỗi: không panic, lỗi có cấu trúc, drop-safe, log triage đủ dữ liệu.
5. Một command profile chuẩn cho baseline và một gate rule duy nhất giữa tất cả artifact.

## 2.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W03) |
|---|---|
| **Change Budget** | `<= 12 files` và `<= 600 LOC net` |
| **Pass/Fail Threshold** | Compile/Static/Lint `100%`; Smoke critical path `>= 95%` |
| **P0/P1 Status** | P0 open `= 0`; P1 unowned `= 0` |
| **Interface Change** | Bắt buộc có **Change Record (CR)** cho mọi thay đổi wire-shape |

## 3) Taxonomy và Evidence

### Task/Issue status

- `NEW`
- `IN_PROGRESS`
- `BLOCKED`
- `DONE`

### Evidence status

- `PENDING_EXECUTION`
- `CAPTURED_PASS`
- `CAPTURED_FAIL`
- `BLOCKED_ENV`

### Evidence ID

- Định dạng: `EV-W3-001`, `EV-W3-002`, ...
- Không được ghi `Done/Pass` nếu chưa có `Evidence ID` hợp lệ.

## 4) Task board (W3-T01..W3-T23)

### Pha 1: Contract freeze

- `W3-T01`: Freeze wire contract (bắt buộc có `schema_version`, `correlation_id`) và parser behavior.
- `W3-T02`: Freeze logging schema với `correlation_id` xuyên suốt bridge -> core -> observability.
- `W3-T03`: Freeze error contract (`error_code`, `correlation_id`, `reason`, `disposition`, `payload_preview`).

### Pha 2: Baseline parser tests

- `W3-T04`: Positive parser tests.
- `W3-T05`: Negative parser tests chuẩn (missing field, wrong type, wrong enum/casing, wrong timestamp).
- `W3-T06`: Cross-runtime parser tests (Python publish -> Rust consume, Rust emit -> Python parse).

### Pha 3: One-pass implementation

- `W3-T07`: Bridge cutover (`zmq_bridge.py`, `messaging.rs`).
- `W3-T08`: Models/types cutover cho Signal, RiskDecision, ExecutionAck.
- `W3-T09`: Observability cutover cho logging/decorators.

### Pha 4: Triage

- `W3-T10`: Triage mismatch theo cụm ưu tiên.
- `W3-T11`: Gán owner/ETA/mitigation cho toàn bộ mismatch.
- `W3-T12`: Dọn toàn bộ P0 về trạng thái có thể gate.

### Pha 5: Cutover rehearsal

- `W3-T13`: Cutover rehearsal end-to-end.
- `W3-T14`: Rollback drill từ snapshot trước cutover (`SCHEMA_STRICT_MODE=false`) trong dưới 5 phút.

### Pha 6: Gate rehearsal

- `W3-T15`: Rerun command profile + evidence capture.
- `W3-T16`: Gate decision rehearsal.

### Pha 7: Hardening & closeout

- `W3-T17`: Final report tuần 3.
- `W3-T18`: Week-4 start pack.
- `W3-T19`: Fuzzing input test cho parser (JSON rác/cực lớn) để chứng minh no-panic.
- `W3-T20`: Shadow log audit (lần vết 5 `correlation_id` ngẫu nhiên qua toàn pipeline).
- `W3-T21`: Sync `PLAYBOOK.md` theo contract schema/correlation patterns mới ở file-level.
- `W3-T22`: Network disconnect simulation trong lúc truyền message lớn qua ZMQ, kiểm chứng auto-recover + triage log.
- `W3-T23`: Capture performance watermark E2E cho `SignalEvent -> ExecutionAck`.

### 4.1) Triage clusters (định nghĩa chuẩn)

- `Cluster A - Incompatibility (P0)`: không parse được hoặc parse crash.
- `Cluster B - Semantic Drift (P1)`: parse được nhưng sai nghĩa nghiệp vụ (unit/enum/field semantics).
- `Cluster C - Observability Gap (P2)`: logic chạy đúng nhưng trace/error evidence không đủ triage.

## 5) Implementation Guide (Doc -> Code -> Test)

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `src/bridge/zmq_bridge.py` | Parse `envelope -> payload`; enforce `schema_version`; normalize Signal field | Adapter reject có kiểm soát + warning marker cho legacy path | Không crash pipeline; không swallow error | parser unit + cross-runtime integration | `EV-W3-1xx` |
| `rust/common/src/messaging.rs` | Parser contract thống nhất; validate field bắt buộc; handle malformed JSON/invalid UTF-8 | Structured parse error (`error_code`,`correlation_id`,`reason`,`disposition`,`payload_preview`) | Không panic khi deserialize fail | Rust parser unit + integration handoff | `EV-W3-1xx` |
| Python/Rust logging decorators | Chuẩn `correlation_id` đồng nhất; gắn `schema_version` vào log context | Mismatch log có payload preview redacted | Không log payload nhạy cảm nguyên bản | observability tests + shadow audit | `EV-W3-3xx` |
| `scripts/compliance_audit.sh` | Auto-check coverage cho `correlation_id` và `schema_version` | Fail-fast return code cho gate automation | Không trả pass khi thiếu log/source | gate dry-run + clean-slate rerun | `EV-W3-4xx` |
| `scripts/audit_correlation.py` | Quét code Python/Rust để phát hiện log call thiếu `correlation_id` context | Report finding theo file:line + fail gate nếu còn lỗ hổng | Không bỏ qua finding ở core path | static audit pass (`0 findings`) | `EV-W3-41x` |
| `PLAYBOOK.md` | Đồng bộ Class/Type và contract behavior cho bridge/messaging/logging | Thêm mapping schema/correlation cho tuần 3 | Không để lệch doc-code sau cutover | doc sync review checklist | `EV-W3-901` |

## 6) Test plan bắt buộc

### 6.1 Clean-slate preflight

```bash
find . -name "__pycache__" -exec rm -rf {} +
cd rust && cargo clean -p common -p signal-bridge -p risk-manager -p execution-engine
```

### 6.2 Command profile chuẩn

```bash
python -m pytest tests/integration/test_backtest_signal_flow.py -q
python -m pytest tests/integration/test_observability_integration.py -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge -p risk-manager -p execution-engine
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
bash scripts/compliance_audit.sh --check-correlation --check-versioning
python scripts/audit_correlation.py --fail-on-findings
```

### 6.3 Scenario bắt buộc

1. Positive: payload đúng chuẩn phải pass.
2. Negative: thiếu field bắt buộc.
3. Negative: sai kiểu dữ liệu.
4. Negative: sai enum/casing.
5. Negative: sai format timestamp.
6. Negative cực đoan: malformed JSON phải trả `QUARANTINE`, không panic.
7. Negative cực đoan: invalid UTF-8 sequence phải trả `QUARANTINE`, không panic.
8. Cross-runtime: Python publish -> Rust consume.
9. Cross-runtime: Rust emit -> Python parse.
10. Observability: log lỗi có `correlation_id`, `error_code`, payload preview redacted.
11. Fuzzing: parser nhận input rác/cực lớn phải reject có mã lỗi, không panic.
12. Shadow log audit: dựng lại trace chain cho 5 `correlation_id` ngẫu nhiên không bị đứt.
13. Network disconnect simulation: ngắt kết nối giữa chừng, pipeline tự phục hồi và log đúng message loss/error.
14. Performance watermark: capture latency E2E `SignalEvent -> ExecutionAck` cho báo cáo cuối.

### 6.4 Continuous test readiness rules

1. Lint/type/static checks phải được chạy xuyên suốt chu kỳ W03.
2. Testcase thay đổi theo hành vi codebase hiện tại, không theo giả định cũ.
3. Cấm sửa code production chỉ để làm pass test lỗi thời.

## 7) Gate rule cuối tuần

`GO` chỉ khi đồng thời:

1. Không còn P0 mở.
2. Toàn bộ test bắt buộc `CAPTURED_PASS` và có evidence.
3. `ISSUE_REGISTER`, `GATE_REHEARSAL_NOTES`, `WEEK3_FINAL_REPORT` không mâu thuẫn.
4. Rollback rehearsal chạy thành công trong dưới 5 phút.
5. `W3-T19`,`W3-T20`,`W3-T21`,`W3-T22`,`W3-T23` đều `CAPTURED_PASS`.
6. `scripts/audit_correlation.py` trả `0 findings` trên core paths.

## 7.1) Gate Checklist (Nhịp W03)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.
- Evidence ID W03: `EV-W3-###`
- Bắt buộc có `CR-W03-###` cho One-pass Cutover.

Nếu thiếu một điều kiện: `NO-GO`.

## 8) Assumptions

- Tuần 3 là implementation-focused, không refactor lan rộng ngoài contract-critical path.
- Mọi artifact dùng chung taxonomy trạng thái và evidence.
- Mọi mismatch mới phải có owner + ETA + mitigation trong 24h.
- Evidence chỉ hợp lệ khi chạy từ clean-slate.

## 9) Execution artifacts

- [week3/KPI_CHARTER_WEEK3.md](week3/KPI_CHARTER_WEEK3.md)
- [week3/CONTRACT_BASELINE_REPORT.md](week3/CONTRACT_BASELINE_REPORT.md)
- [week3/CUTOVER_PLAN.md](week3/CUTOVER_PLAN.md)
- [week3/ISSUE_REGISTER_WEEK3.md](week3/ISSUE_REGISTER_WEEK3.md)
- [week3/INTERFACE_IMPLEMENTATION_SPEC.md](week3/INTERFACE_IMPLEMENTATION_SPEC.md)
- [week3/GATE_REHEARSAL_NOTES.md](week3/GATE_REHEARSAL_NOTES.md)
- [week3/WEEK3_FINAL_REPORT_AND_WEEK4_START_PACK.md](week3/WEEK3_FINAL_REPORT_AND_WEEK4_START_PACK.md)

### 9.1) Auto-Gate Script

```bash
bash scripts/compliance_audit.sh --check-correlation --check-versioning
python scripts/audit_correlation.py --fail-on-findings
```

- Script phải fail-fast nếu thiếu dấu vết `correlation_id` hoặc thiếu bằng chứng `schema_version`.
- Kết quả script được map vào gate checklist như điều kiện bắt buộc.

---
Last updated: W03 no-date mode sync
