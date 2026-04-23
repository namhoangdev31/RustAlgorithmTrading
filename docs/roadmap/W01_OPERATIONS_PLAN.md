# Kế Hoạch Vận Hành Tuần 1 (W01, No-Date Mode)

## 1) Mục tiêu tuần

Mục tiêu W01 là thiết lập baseline đủ tin cậy để sang W02 (Contract Audit) với dữ liệu đo được và rule vận hành rõ ràng.

Kết quả bắt buộc cuối tuần:

1. KPI board hoạt động, có dữ liệu theo chu kỳ vận hành.
2. Baseline compile/static/smoke có trạng thái pass/fail rõ.
3. Issue register có owner, mức ưu tiên, ETA, evidence.
4. Báo cáo cuối tuần chuẩn hóa cho quyết định Go/No-Go W02.

Ràng buộc W01:

- Không thay đổi production API.
- Chỉ chuẩn hóa spec draft cho các interface mục tiêu (`schema_version`, `RiskDecision`, `ExecutionAck`, `ObservabilityEvent`).
- Dùng duy nhất `correlation_id` cho traceability.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W01) |
|---|---|
| **Change Budget** | `<= 12 files` và `<= 600 LOC net` |
| **Pass/Fail Threshold** | Compile/Static/Lint `100%`; Smoke critical path `>= 95%` |
| **P0/P1 Status** | P0 open `= 0`; P1 unowned `= 0` |

---

## 2) Task board theo chu kỳ (W1-T01 -> W1-T18)

### D1: Kickoff + baseline khởi tạo

- `W1-T01` Chốt KPI dictionary: Reliability, Trading quality, Risk, Engineering, Observability.
- `W1-T02` Chốt dashboard layout + nguồn dữ liệu cho từng KPI.
- `W1-T03` Tạo issue board W01 với nhãn `P0/P1/P2`, `owner`, `ETA`.

### D2: Baseline kỹ thuật Python/Rust

- `W1-T04` Baseline Python stack + dependency blockers.
- `W1-T05` Baseline Rust workspace check/build.
- `W1-T06` Snapshot pass/fail theo nhóm (`compile/static/smoke`).

### D3: Baseline vận hành/observability

- `W1-T07` Xác nhận metrics/logs/alert path thu thập được.
- `W1-T08` Định nghĩa SLO tạm thời W01.
- `W1-T09` Chạy health-check runbook và ghi gap.

### D4: Backlog triage

- `W1-T10` Triage issue theo severity và tác động W02-W04.
- `W1-T11` Nhóm issue theo cụm (`test/dependency`, `contract`, `runtime`, `docs drift`).
- `W1-T12` Gán owner + ETA + exit criteria.

### D5: Interface spec draft

- `W1-T13` Soạn draft interface theo canonical envelope.
- `W1-T14` Map spec với test scenarios W02-W03.

### D6: Gate rehearsal

- `W1-T15` Chạy rehearsal gate theo checklist W01.
- `W1-T16` Soát P0/P1 unowned.

### D7: Closeout

- `W1-T17` Xuất báo cáo W01.
- `W1-T18` Chốt W02 start pack.

---

## 3) Checklist vận hành

### Checklist hằng ngày

- KPI board được cập nhật theo chu kỳ.
- Có ít nhất 1 kiểm tra compile/static/smoke được cập nhật.
- Issue mới có severity + owner trong 24h.
- Không có P0 unowned.
- Decision log cập nhật cuối chu kỳ.

### Checklist cuối tuần

- Có baseline số liệu cho toàn bộ nhóm KPI.
- Có baseline matrix với pass/fail rõ nguyên nhân.
- Có issue register chuẩn hóa (`issue_id`, `severity`, `owner`, `ETA`, `evidence_id`).
- Có interface spec draft v0 cho 4 type mục tiêu.
- Có final report + quyết định Go/No-Go cho W02.

---

## 4) Issue tồn đọng khởi tạo W01

### P0

| ID | Issue | Tác động | Điều kiện đóng W01 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W1-ISS-001` | Python test collection fail do thiếu dependency (`pandas`) | Chặn baseline unit | Có hướng dẫn env/deps chuẩn và baseline chạy được | `tester` | `W01-D2` |
| `W1-ISS-002` | Canonical doc drift | Lệch source-of-truth | Có mapping doc thay thế hợp lệ + backlog hygiene | `planner` | `W01-D4` |

### P1

| ID | Issue | Tác động | Điều kiện đóng W01 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W1-ISS-003` | Runtime TODO còn tồn trong `rust/market-data` | Risk completeness pipeline | Có technical note + plan xử lý W02/W03 | `coder` | `W01-D5` |
| `W1-ISS-004` | Runbook thiếu check circuit breaker | Giảm độ tin cậy incident ops | Có command/procedure rõ và owner | `ops` | `W01-D5` |

### P2

| ID | Issue | Tác động | Điều kiện đóng W01 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W1-ISS-005` | Một số index/version/status docs chưa đồng bộ | Nhiễu quản trị tài liệu | Gom backlog hygiene cho W02 | `planner` | `W01-D7` |

---

## 5) Test plan W01 (baseline-focused)

Mục tiêu W01 là baseline ổn định, không hard-fix diện rộng.

Kịch bản bắt buộc:

1. Python baseline compile/static.
2. Rust workspace check baseline.
3. Smoke integration path `signal -> risk -> execution`.
4. Observability path với `correlation_id`.

**Rule test ownership**:

- Test phản ánh hành vi codebase hiện tại.
- Không sửa code production chỉ để hợp test lỗi thời.
- Mọi thay đổi code phải cập nhật test liên quan trong cùng tuần.

## 5.1) Gate Checklist (Nhịp W01)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.

- Evidence ID W01: `EV-W1-###`

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo task.
4. Issue Register snapshot.
5. Decision Log.
6. W02 Start Pack.

---

## 7) KPI dictionary W01

### Reliability

- Service uptime theo market-hours.
- Incident P0/P1 count.
- MTTR.

### Trading quality

- Reject rate.
- Duplicate order rate.
- Fill quality trend.

### Risk

- Breach count theo limit type.
- Daily loss guardrail adherence.
- Drawdown snapshot.

### Engineering quality

- Compile/static pass rate.
- Smoke runtime pass rate.
- Regression count sau thay đổi.

### Observability

- Coverage `correlation_id` qua luồng signal -> execution.
- Alert precision.
- Log completeness theo service.

---

## 8) Assumptions & defaults

- Team vận hành theo squad liên chức năng.
- W01 ưu tiên baseline + governance, không refactor lớn.
- Mọi thay đổi bám nguyên tắc `Doc -> Code -> Test`.
- Weekly gate dùng compile/static/smoke, chưa chạy full suite.

---
Last updated: W01 no-date mode sync

## Execution artifacts (Week 1)

- [week1/KPI_CHARTER_V1.md](week1/KPI_CHARTER_V1.md)
- [week1/BASELINE_VALIDATION_REPORT_V1.md](week1/BASELINE_VALIDATION_REPORT_V1.md)
- [week1/OBSERVABILITY_BASELINE_SLO_DRAFT.md](week1/OBSERVABILITY_BASELINE_SLO_DRAFT.md)
- [week1/ISSUE_REGISTER_V1.md](week1/ISSUE_REGISTER_V1.md)
- [week1/INTERFACE_SPEC_DRAFT_V0.md](week1/INTERFACE_SPEC_DRAFT_V0.md)
- [week1/GATE_REHEARSAL_NOTES.md](week1/GATE_REHEARSAL_NOTES.md)
- [week1/WEEK1_FINAL_REPORT_AND_WEEK2_START_PACK.md](week1/WEEK1_FINAL_REPORT_AND_WEEK2_START_PACK.md)
