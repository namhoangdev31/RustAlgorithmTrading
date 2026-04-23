# Kế Hoạch Vận Hành Tuần 1 (20/04/2026-26/04/2026)

## 1) Mục tiêu tuần

Mục tiêu tuần 1 là thiết lập baseline đủ tin cậy để bước sang tuần 2 (Contract Audit) với dữ liệu đo được.

Kết quả bắt buộc cuối tuần:

1. KPI board hoạt động và có dữ liệu hằng ngày.
2. Baseline test/build có trạng thái pass/fail theo nhóm.
3. Issue register có owner, mức ưu tiên, hạn xử lý.
4. Báo cáo cuối tuần chuẩn hóa để quyết định Go/No-Go tuần 2.

Ràng buộc tuần 1:

- Không thay đổi production API.
- Chỉ chuẩn hóa spec draft cho các interface tuần 2-3:
  - `schema_version`
  - `RiskDecision`
  - `ExecutionAck`
  - `ObservabilityEvent`

---

## 2) Task board theo ngày (W1-T01 -> W1-T18)

### Ngày 1 - Thứ Hai (20/04): Kickoff + baseline khởi tạo

- `W1-T01` Chốt KPI dictionary: Reliability, Trading quality, Risk, Engineering, Observability.
- `W1-T02` Chốt dashboard layout + nguồn dữ liệu cho từng KPI.
- `W1-T03` Tạo issue board tuần 1 với nhãn `P0/P1/P2`, `owner`, `due`.
- Đầu ra: `KPI Charter v1` + `Issue Board v1`.

### Ngày 2 - Thứ Ba (21/04): Baseline kỹ thuật Python/Rust

- `W1-T04` Baseline Python test stack; ghi nhận blocker dependency (`pandas`) khi collect test.
- `W1-T05` Baseline Rust workspace check/test (compile/test matrix).
- `W1-T06` Snapshot pass/fail theo nhóm test (`unit/integration/observability`).
- Đầu ra: `Baseline Validation Report v1`.

### Ngày 3 - Thứ Tư (22/04): Baseline vận hành/observability

- `W1-T07` Xác nhận metrics/logs/alert path đang thu thập được.
- `W1-T08` Định nghĩa SLO tạm thời tuần 1 (không khóa target production).
- `W1-T09` Chạy 1 vòng health-check runbook, ghi gap vận hành.
- Đầu ra: `Observability Baseline + SLO Draft`.

### Ngày 4 - Thứ Năm (23/04): Backlog triage issue tồn đọng

- `W1-T10` Triage issue theo severity và tác động tới tuần 2-4.
- `W1-T11` Nhóm issue theo cụm:
  - Test/Dependency
  - Contract/Integration
  - Runtime TODO kỹ thuật
  - Documentation canonical drift
- `W1-T12` Gán owner + ETA + điều kiện đóng issue.
- Đầu ra: `Issue Register v1 (decision-ready)`.

### Ngày 5 - Thứ Sáu (24/04): Chuẩn hóa interface spec (draft)

- `W1-T13` Soạn draft interface:
  - `schema_version` (ZMQ envelope)
  - `RiskDecision`
  - `ExecutionAck`
  - `ObservabilityEvent`
- `W1-T14` Map draft spec với test scenarios cho tuần 2-3.
- Đầu ra: `Interface Spec Draft v0`.

### Ngày 6 - Thứ Bảy (25/04): Gate rehearsal

- `W1-T15` Chạy rehearsal gate theo checklist Go/No-Go.
- `W1-T16` Soát issue P0/P1 chưa owner hoặc chưa ETA.
- Đầu ra: `Gate Rehearsal Notes`.

### Ngày 7 - Chủ Nhật (26/04): Báo cáo tuần 1 + kế hoạch tuần 2

- `W1-T17` Xuất báo cáo cuối tuần.
- `W1-T18` Chốt kế hoạch tuần 2 (Contract Audit) dựa trên issue thực tế.
- Đầu ra: `Week-1 Final Report + Week-2 Start Pack`.

---

## 3) Checklist vận hành

### Checklist hằng ngày

- KPI board có dữ liệu trong ngày.
- Có ít nhất 1 kiểm tra trạng thái test/build được cập nhật.
- Issue mới được gán severity + owner trong 24 giờ.
- Không có issue P0 ở trạng thái unowned.
- Decision log được cập nhật cuối ngày.

### Checklist cuối tuần (bắt buộc pass)

- Có baseline số liệu cho toàn bộ nhóm KPI.
- Có baseline test matrix với pass/fail rõ nguyên nhân.
- Có issue register chuẩn hóa (ID, mức độ, owner, ETA, dependency).
- Có interface spec draft v0 cho 4 type mục tiêu.
- Có báo cáo tuần 1 + quyết định Go/No-Go cho tuần 2.

---

## 4) Issue tồn đọng khởi tạo (từ trạng thái repo hiện tại)

### P0 (bắt buộc có owner trong tuần 1)

| ID | Issue | Tác động | Điều kiện đóng tuần 1 | Owner mặc định | Due |
|---|---|---|---|---|---|
| `W1-ISS-001` | Python test collection fail do thiếu dependency (`pandas`) | Chặn baseline unit tests Python | Test collection chạy được cho bộ unit chính hoặc có lockfile/env instruction chuẩn | `tester` | 21/04/2026 |
| `W1-ISS-002` | Canonical doc drift (một số path canonical không tồn tại) | Lệch source-of-truth khi onboarding/planning | Có mapping doc thay thế đang tồn tại + issue chỉnh canonical ở tuần 2 | `planner` | 23/04/2026 |

### P1 (phải có kế hoạch xử lý)

| ID | Issue | Tác động | Điều kiện đóng tuần 1 | Owner mặc định | Due |
|---|---|---|---|---|---|
| `W1-ISS-003` | Runtime TODO còn tồn trong `rust/market-data` (publisher/event processing) | Risk completeness data pipeline | Có technical note + ETA tuần 2/3 (không bắt buộc code fix tuần 1) | `coder` | 24/04/2026 |
| `W1-ISS-004` | Runbook còn TODO check circuit breaker status | Giảm độ tin cậy thao tác incident | Có action owner + command/procedure đề xuất để operationalize | `ops` | 24/04/2026 |

### P2 (theo dõi tuần sau)

| ID | Issue | Tác động | Điều kiện đóng tuần 1 | Owner mặc định | Due |
|---|---|---|---|---|---|
| `W1-ISS-005` | Một số index/version/status chưa đồng bộ giữa docs lớn | Nhiễu quản trị tài liệu | Gom thành batch doc hygiene backlog tuần 2 | `planner` | 26/04/2026 |

---

## 5) Test plan tuần 1 (baseline-focused)

Mục tiêu tuần 1 là baseline, không phải hard-fix toàn bộ.

Kịch bản bắt buộc:

1. Python unit collection baseline (ghi rõ blocker dependency).
2. Rust workspace check/test baseline.
3. Smoke integration path: signal -> risk -> execution (mức đo được).
4. Observability path: trace/log/metrics hiện diện theo service.

Tiêu chí pass tuần 1:

- Có baseline report có thể lặp lại.
- Mọi failure có `issue_id + owner + ETA`.

---

## 6) Mẫu báo cáo cuối tuần (Week-1 Final Report)

### 1. Executive Summary

- Trạng thái tuần 1: `Go` hoặc `No-Go` vào tuần 2.
- 3 kết quả lớn nhất.
- 3 rủi ro lớn nhất.

### 2. KPI Snapshot

- Reliability / Trading quality / Risk / Engineering / Observability.
- So sánh `Target tuần 1` vs `Actual`.

### 3. Delivery Status theo Task

- Trạng thái `W1-T01..W1-T18`: `Done/In progress/Blocked` + bằng chứng.

### 4. Issue Register

- Danh sách P0/P1/P2, owner, ETA, blocker dependency.

### 5. Decision Log

- Quyết định đã chốt cho tuần 2.
- Giả định còn mở cần xác nhận.

### 6. Week-2 Start Pack

- Top 5 task ưu tiên tuần 2.
- Điều kiện khởi động ngày đầu tuần 2.

---

## 7) KPI dictionary khuyến nghị cho tuần 1

### Reliability
- Service uptime trong market-hours.
- P0/P1 incident count.
- MTTR.

### Trading quality
- Reject rate.
- Duplicate order rate.
- Fill quality trend (theo ngày).

### Risk
- Breach count theo limit type.
- Daily loss guardrail adherence.
- Drawdown theo phiên.

### Engineering quality
- Unit/integration pass rate.
- Regression count sau thay đổi.
- Build stability theo workspace.

### Observability
- Coverage `trace_id` qua luồng signal -> execution.
- Alert precision (false-positive / false-negative).
- Log completeness theo service.

---

## 8) Assumptions & defaults

- Team vận hành theo 1 squad liên chức năng: planner/researcher/coder/tester/reviewer/ops.
- Tuần 1 ưu tiên baseline + issue governance; không đặt mục tiêu refactor lớn.
- Mọi thay đổi tuần 1 bám nguyên tắc `Doc -> Code -> Test` và có trace qua issue ID.

---

Last updated: 2026-04-14

## Execution artifacts (Week 1)

Artifacts được tạo để vận hành thực tế tuần 1:

- [week1/KPI_CHARTER_V1.md](week1/KPI_CHARTER_V1.md)
- [week1/BASELINE_VALIDATION_REPORT_V1.md](week1/BASELINE_VALIDATION_REPORT_V1.md)
- [week1/OBSERVABILITY_BASELINE_SLO_DRAFT.md](week1/OBSERVABILITY_BASELINE_SLO_DRAFT.md)
- [week1/ISSUE_REGISTER_V1.md](week1/ISSUE_REGISTER_V1.md)
- [week1/INTERFACE_SPEC_DRAFT_V0.md](week1/INTERFACE_SPEC_DRAFT_V0.md)
- [week1/GATE_REHEARSAL_NOTES.md](week1/GATE_REHEARSAL_NOTES.md)
- [week1/WEEK1_FINAL_REPORT_AND_WEEK2_START_PACK.md](week1/WEEK1_FINAL_REPORT_AND_WEEK2_START_PACK.md)
