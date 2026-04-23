# Kế Hoạch Vận Hành Tuần 2 (27/04/2026-03/05/2026)

## 1) Mục tiêu tuần

Mục tiêu tuần 2 là hoàn tất Contract Audit Python-Rust để bước sang tuần 3 (Schema Versioning) với danh sách mismatch rõ ràng, owner rõ ràng và policy tương thích đã được chốt.

Kết quả bắt buộc cuối tuần:

1. Contract inventory đầy đủ cho các boundary Python <-> Rust.
2. Compatibility policy (PyO3/Python runtime + schema compatibility) được chấp nhận.
3. Issue register tuần 2 quyết định được theo cụm mismatch.
4. Báo cáo cuối tuần có quyết định Go/No-Go vào tuần 3 dựa trên evidence.

Ràng buộc tuần 2:

- Không thay đổi production API trực tiếp.
- Chỉ audit/spec/policy cho các contract mục tiêu:
  - `schema_version`
  - `RiskDecision`
  - `ExecutionAck`
  - `ObservabilityEvent`

---

## 2) Task board theo ngày (W2-T01 -> W2-T18)

### Ngày 1 - Thứ Hai (27/04): Chốt phạm vi audit + inventory

- `W2-T01` Chốt phạm vi boundary contract Python <-> Rust cần audit.
- `W2-T02` Lập inventory owner file + test path cho từng boundary.
- `W2-T03` Chốt taxonomy mismatch (`schema`, `semantics`, `compat`, `observability`, `docs`).
- Đầu ra: `Contract Compatibility Matrix v1`.

### Ngày 2 - Thứ Ba (28/04): Baseline contract validation

- `W2-T04` Chạy baseline validation cho contract-focused command set (Python/Rust).
- `W2-T05` Ghi mismatch evidence theo từng boundary và severity.
- `W2-T06` Tạo baseline snapshot pass/fail và map issue ID.
- Đầu ra: `Contract Audit Baseline Report v1`.

### Ngày 3 - Thứ Tư (29/04): Compatibility policy

- `W2-T07` Chốt policy PyO3/Python runtime cho local/dev/CI.
- `W2-T08` Chốt policy compatibility cho `schema_version` (`v0` legacy -> `v1`).
- `W2-T09` Ghi acceptance criteria để rerun baseline nhất quán.
- Đầu ra: `Interface Spec Delta v1` + policy notes trong baseline report.

### Ngày 4 - Thứ Năm (30/04): Triage mismatch theo cụm

- `W2-T10` Triage mismatch theo cụm: schema/semantics/observability/docs.
- `W2-T11` Gán severity, owner, ETA, mitigation cho từng mismatch.
- `W2-T12` Soát P0/P1 không để trạng thái unowned.
- Đầu ra: `Issue Register v2`.

### Ngày 5 - Thứ Sáu (01/05): Chốt interface delta draft

- `W2-T13` Chốt field-level delta cho `schema_version` envelope.
- `W2-T14` Chốt delta cho `RiskDecision`, `ExecutionAck`, `ObservabilityEvent`.
- Đầu ra: `Interface Spec Delta v1` (decision-ready cho tuần 3).

### Ngày 6 - Thứ Bảy (02/05): Gate rehearsal

- `W2-T15` Chạy rehearsal theo checklist Go/No-Go tuần 2.
- `W2-T16` Soát lại condition `no P0 unowned` + `rerun baseline`.
- Đầu ra: `Gate Rehearsal Notes`.

### Ngày 7 - Chủ Nhật (03/05): Báo cáo tuần 2 + kế hoạch tuần 3

- `W2-T17` Xuất báo cáo cuối tuần 2.
- `W2-T18` Chốt Week-3 Start Pack cho schema versioning kickoff.
- Đầu ra: `Week-2 Final Report + Week-3 Start Pack`.

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Contract inventory được cập nhật khi phát sinh boundary mới.
- Có ít nhất 1 baseline check được cập nhật trạng thái mỗi ngày.
- Mismatch mới có severity + owner trong 24 giờ.
- Không có mismatch P0 ở trạng thái unowned.
- Decision log cập nhật cuối ngày.

### Checklist cuối tuần (bắt buộc pass)

- Có contract compatibility matrix đầy đủ owner file + test path.
- Có baseline report với pass/fail rõ theo command set.
- Có issue register chuẩn hóa (`issue_id`, severity, owner, ETA, mitigation).
- Có interface spec delta v1 cho 4 contract mục tiêu.
- Có báo cáo tuần 2 + quyết định Go/No-Go tuần 3.

---

## 4) Issue tồn đọng khởi tạo tuần 2

### P0 (bắt buộc có owner trong tuần 2)

| ID | Issue | Tác động | Điều kiện đóng tuần 2 | Owner mặc định | Due |
|---|---|---|---|---|---|
| `W2-ISS-001` | Contract inventory chưa đầy đủ boundary Python-Rust | Chặn audit coverage | Có matrix owner file + test path cho boundary critical path | `planner` | 28/04/2026 |
| `W2-ISS-002` | Compatibility policy PyO3/Python runtime chưa chuẩn hóa | Chặn rerun build/test nhất quán | Có policy chính thức cho local/dev/CI và command chuẩn | `tester` | 29/04/2026 |
| `W2-ISS-003` | `schema_version` chưa được cưỡng bức thống nhất trong contract audit | Risk mismatch khi vào tuần 3 | Có delta spec + acceptance rõ cho envelope `v1` | `coder` | 30/04/2026 |

### P1 (phải có kế hoạch xử lý)

| ID | Issue | Tác động | Điều kiện đóng tuần 2 | Owner mặc định | Due |
|---|---|---|---|---|---|
| `W2-ISS-004` | `RiskDecision` semantics chưa đồng bộ đầy đủ giữa service | Risk reject/allow không nhất quán | Có mismatch list + mitigation + test mapping | `coder` | 01/05/2026 |
| `W2-ISS-005` | `ExecutionAck` thiếu chuẩn đo `latency_bucket/retry_count` ở một số luồng | Nhiễu observability/execution audit | Có delta spec + owner cho implementation tuần 3 | `reviewer` | 01/05/2026 |
| `W2-ISS-006` | `ObservabilityEvent` component/severity mapping chưa khóa | Traceability và alert semantics không ổn định | Có mapping chuẩn + acceptance trong interface delta | `ops` | 02/05/2026 |

### P2 (theo dõi tuần sau)

| ID | Issue | Tác động | Điều kiện đóng tuần 2 | Owner mặc định | Due |
|---|---|---|---|---|---|
| `W2-ISS-007` | Canonical/doc drift theo contract docs | Nhiễu source-of-truth khi onboarding tuần 3 | Gom backlog hygiene + mapping thay thế | `planner` | 03/05/2026 |
| `W2-ISS-008` | Contract test skeleton chưa phủ đủ negative cases | Risk sót mismatch khi schema versioning | Có kế hoạch mở rộng test skeleton tuần 3 | `tester` | 03/05/2026 |

---

## 5) Test plan tuần 2 (contract-focused)

Mục tiêu tuần 2 là audit và xác nhận tương thích, không hard-fix production behavior diện rộng.

Kịch bản bắt buộc:

1. Contract inventory completeness: mỗi boundary có owner file + test path.
2. Contract validation baseline (positive + negative): thiếu field, sai type, version mismatch.
3. Compatibility checks cho Python runtime/PyO3 policy theo command chuẩn.
4. Smoke traceability baseline cho `schema_version` + `trace_id` qua signal -> execution.

Command pack baseline đề xuất:

```bash
python -m pytest tests/unit/python/test_strategy_base.py -q --maxfail=1
python -m pytest tests/integration/test_backtest_signal_flow.py -q
cd rust && cargo check --workspace
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p signal-bridge -p common
bash scripts/health_check.sh
```

Tiêu chí pass tuần 2:

- Có baseline report rerun được với command guidance rõ.
- Mọi mismatch/failure có `issue_id + owner + ETA + mitigation`.
- Không còn mismatch P0 unowned trước gate cuối tuần.

---

## 6) Mẫu báo cáo cuối tuần (Week-2 Final Report)

### 1. Executive Summary

- Trạng thái tuần 2: `Go` hoặc `No-Go` vào tuần 3.
- 3 kết quả lớn nhất.
- 3 rủi ro lớn nhất.

### 2. KPI Snapshot

- Reliability / Contract Quality / Risk / Engineering / Observability.
- So sánh `Target tuần 2` vs `Actual`.

### 3. Delivery Status theo Task

- Trạng thái `W2-T01..W2-T18`: `Done/In progress/Blocked` + bằng chứng.

### 4. Issue Register

- Danh sách P0/P1/P2, owner, ETA, mitigation, dependency.

### 5. Decision Log

- Quyết định đã chốt cho tuần 3.
- Giả định còn mở cần xác nhận.

### 6. Week-3 Start Pack

- Top 5 task ưu tiên tuần 3.
- Điều kiện khởi động ngày đầu tuần 3.

---

## 7) KPI dictionary khuyến nghị cho tuần 2

### Reliability
- Contract check rerun stability theo ngày.
- P0/P1 mismatch incident count.
- MTTR cho mismatch critical.

### Contract Quality
- Contract inventory coverage (% boundary có mapping owner + test).
- Mismatch closure rate theo severity.
- `schema_version` compliance coverage.

### Risk
- `RiskDecision` reject semantics consistency.
- Coverage `limit_snapshot` trong audit evidence.
- Risk mismatch impact count trên critical path.

### Engineering quality
- Contract-focused unit/integration pass rate.
- Build stability với compatibility policy đã chốt.
- Regression count sau cập nhật spec/policy.

### Observability
- Coverage `trace_id` cho event contract critical.
- `ObservabilityEvent` field completeness.
- Severity mapping consistency theo service.

---

## 8) Assumptions & defaults

- Team vận hành tuần 2 theo squad: planner/researcher/coder/tester/reviewer/ops.
- Tuần 2 ưu tiên audit/spec/policy, không refactor lớn.
- Mọi mismatch cần trace qua issue ID và evidence command/log cụ thể.
- Kế hoạch bám nguyên tắc `Doc -> Code -> Test`.

---

Last updated: 2026-04-23

## Execution artifacts (Week 2)

Artifacts được tạo để vận hành thực tế tuần 2:

- [week2/KPI_CHARTER_V2.md](week2/KPI_CHARTER_V2.md)
- [week2/CONTRACT_AUDIT_BASELINE_REPORT_V1.md](week2/CONTRACT_AUDIT_BASELINE_REPORT_V1.md)
- [week2/CONTRACT_COMPATIBILITY_MATRIX_V1.md](week2/CONTRACT_COMPATIBILITY_MATRIX_V1.md)
- [week2/ISSUE_REGISTER_V2.md](week2/ISSUE_REGISTER_V2.md)
- [week2/INTERFACE_SPEC_DELTA_V1.md](week2/INTERFACE_SPEC_DELTA_V1.md)
- [week2/GATE_REHEARSAL_NOTES.md](week2/GATE_REHEARSAL_NOTES.md)
- [week2/WEEK2_FINAL_REPORT_AND_WEEK3_START_PACK.md](week2/WEEK2_FINAL_REPORT_AND_WEEK3_START_PACK.md)
