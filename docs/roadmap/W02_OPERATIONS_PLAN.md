# Kế Hoạch Vận Hành Tuần 2 (W02, No-Date Mode)

## 1) Mục tiêu tuần

Mục tiêu W02 là hoàn tất Contract Audit Python-Rust để mở W03 với mismatch rõ ràng, owner rõ ràng và policy tương thích đã chốt.

Kết quả bắt buộc cuối tuần:
1. Contract inventory đầy đủ cho boundary Python <-> Rust.
2. Compatibility policy được chấp nhận.
3. Issue register W02 quyết định được theo cụm mismatch.
4. Final report có quyết định Go/No-Go W03 dựa trên evidence.

Ràng buộc W02:
- Không thay đổi production API trực tiếp.
- Chỉ audit/spec/policy cho contract mục tiêu.
- Dùng duy nhất `correlation_id` cho observability contract.

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W02) |
|---|---|
| **Change Budget** | `<= 12 files` và `<= 600 LOC net` |
| **Pass/Fail Threshold** | Compile/Static/Lint `100%`; Smoke critical path `>= 95%` |
| **P0/P1 Status** | P0 open `= 0`; P1 unowned `= 0` |
| **Interface Change** | Bắt buộc có **Change Record (CR)** cho mọi thay đổi wire-shape |

---

## 2) Task board theo chu kỳ (W2-T01 -> W2-T18)

### D1: Scope audit + inventory
- `W2-T01` Chốt phạm vi boundary contract cần audit.
- `W2-T02` Lập inventory owner file + test path.
- `W2-T03` Chốt taxonomy mismatch (`schema`, `semantics`, `compat`, `observability`, `docs`).

### D2: Baseline contract validation
- `W2-T04` Chạy baseline validation cho command set contract-focused.
- `W2-T05` Ghi mismatch evidence theo boundary/severity.
- `W2-T06` Tạo snapshot pass/fail và map issue ID.

### D3: Compatibility policy
- `W2-T07` Chốt policy runtime local/dev/CI.
- `W2-T08` Chốt policy compatibility cho `schema_version`.
- `W2-T09` Chốt acceptance criteria cho rerun baseline.

### D4: Triage mismatch
- `W2-T10` Triage mismatch theo cụm.
- `W2-T11` Gán severity, owner, ETA, mitigation.
- `W2-T12` Soát P0/P1 không để unowned.

### D5: Chốt interface delta
- `W2-T13` Chốt delta cho envelope.
- `W2-T14` Chốt delta cho RiskDecision/ExecutionAck/ObservabilityEvent.

### D6: Gate rehearsal
- `W2-T15` Chạy rehearsal theo checklist Go/No-Go.
- `W2-T16` Soát điều kiện `no P0 unowned` + `baseline rerun`.

### D7: Closeout
- `W2-T17` Xuất final report W02.
- `W2-T18` Chốt W03 start pack.

---

## 3) Checklist vận hành

### Checklist hằng ngày
- Contract inventory được cập nhật khi phát sinh boundary mới.
- Có ít nhất 1 baseline check được cập nhật trạng thái.
- Mismatch mới có severity + owner trong 24h.
- Không có mismatch P0 unowned.
- Decision log cập nhật cuối chu kỳ.

### Checklist cuối tuần
- Có contract matrix đầy đủ owner file + test path.
- Có baseline report với pass/fail rõ.
- Có issue register chuẩn hóa (`issue_id`, `severity`, `owner`, `ETA`, `mitigation`).
- Có interface delta v1 cho 4 contract mục tiêu.
- Có final report + quyết định Go/No-Go W03.

---

## 4) Issue tồn đọng khởi tạo W02

### P0
| ID | Issue | Tác động | Điều kiện đóng W02 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W2-ISS-001` | Contract inventory chưa đầy đủ boundary | Chặn audit coverage | Có matrix owner file + test path cho boundary critical | `planner` | `W02-D2` |
| `W2-ISS-002` | Compatibility policy runtime chưa chuẩn hóa | Chặn baseline rerun nhất quán | Có policy chính thức local/dev/CI | `tester` | `W02-D3` |
| `W2-ISS-003` | `schema_version` chưa cưỡng bức thống nhất trong audit | Risk mismatch vào W03 | Có delta spec + acceptance rõ | `coder` | `W02-D4` |

### P1
| ID | Issue | Tác động | Điều kiện đóng W02 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W2-ISS-004` | `RiskDecision` semantics chưa đồng bộ | Risk reject/allow không nhất quán | Có mismatch list + mitigation + test mapping | `coder` | `W02-D5` |
| `W2-ISS-005` | `ExecutionAck` telemetry thiếu chuẩn | Nhiễu observability/execution audit | Có delta spec + owner cho implementation W03 | `reviewer` | `W02-D5` |
| `W2-ISS-006` | `ObservabilityEvent` mapping chưa khóa | Traceability semantics không ổn định | Có mapping chuẩn + acceptance | `ops` | `W02-D6` |

### P2
| ID | Issue | Tác động | Điều kiện đóng W02 | Owner mặc định | ETA |
|---|---|---|---|---|---|
| `W2-ISS-007` | Canonical/doc drift theo contract docs | Nhiễu source-of-truth | Gom backlog hygiene + mapping thay thế | `planner` | `W02-D7` |
| `W2-ISS-008` | Contract test skeleton thiếu negative coverage | Risk sót mismatch khi vào W03 | Có kế hoạch mở rộng test skeleton | `tester` | `W02-D7` |

---

## 5) Test plan W02 (contract-focused)

Mục tiêu W02 là audit và xác nhận tương thích; chưa mở refactor logic diện rộng.

Kịch bản bắt buộc:
1. Contract inventory completeness.
2. Baseline contract validation (positive + negative).
3. Compatibility checks cho runtime policy.
4. Smoke traceability baseline cho `schema_version` + `correlation_id`.

Command pack baseline đề xuất:
```bash
python -m pytest tests/unit/python/test_strategy_base.py -q --maxfail=1
python -m pytest tests/integration/test_backtest_signal_flow.py -q
cd rust && cargo check --workspace
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p signal-bridge -p common
bash scripts/health_check.sh
```

**Rule test ownership**:
- Test phản ánh hành vi codebase hiện tại.
- Khi spec đổi hợp lệ, test đổi theo spec có evidence.
- Cấm điều chỉnh code production chỉ để hợp test lỗi thời.

## 5.1) Gate Checklist (Nhịp W02)

Sử dụng trực tiếp [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho các đầu mục bắt buộc.
- Evidence ID W02: `EV-W2-###`
- Mọi Interface Change phải được link tới một `CR-W02-###` hợp lệ.

---

## 6) Mẫu báo cáo cuối tuần

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo task.
4. Issue Register snapshot.
5. Decision Log.
6. W03 Start Pack.

---

## 7) KPI dictionary W02

### Reliability
- Contract rerun stability.
- P0/P1 mismatch count.
- MTTR mismatch critical.

### Contract Quality
- Contract inventory coverage.
- Mismatch closure rate.
- `schema_version` compliance.

### Risk
- `RiskDecision` semantics consistency.
- Coverage `limit_snapshot` trong evidence.
- Risk mismatch impact count.

### Engineering quality
- Contract-focused compile/static/smoke pass rate.
- Build compatibility stability.
- Regression count sau cập nhật spec/policy.

### Observability
- Coverage `correlation_id` cho event contract critical.
- `ObservabilityEvent` field completeness.
- Severity mapping consistency.

---

## 8) Assumptions & defaults

- Team W02 vận hành theo squad liên chức năng.
- W02 ưu tiên audit/spec/policy, không refactor lớn.
- Mọi mismatch trace qua issue ID + evidence cụ thể.
- Weekly gate dùng compile/static/smoke; full suite để W21-W24.

---
Last updated: W02 no-date mode sync

## Execution artifacts (Week 2)

- [week2/KPI_CHARTER_V2.md](week2/KPI_CHARTER_V2.md)
- [week2/CONTRACT_AUDIT_BASELINE_REPORT_V1.md](week2/CONTRACT_AUDIT_BASELINE_REPORT_V1.md)
- [week2/CONTRACT_COMPATIBILITY_MATRIX_V1.md](week2/CONTRACT_COMPATIBILITY_MATRIX_V1.md)
- [week2/ISSUE_REGISTER_V2.md](week2/ISSUE_REGISTER_V2.md)
- [week2/INTERFACE_SPEC_DELTA_V1.md](week2/INTERFACE_SPEC_DELTA_V1.md)
- [week2/GATE_REHEARSAL_NOTES.md](week2/GATE_REHEARSAL_NOTES.md)
- [week2/WEEK2_FINAL_REPORT_AND_WEEK3_START_PACK.md](week2/WEEK2_FINAL_REPORT_AND_WEEK3_START_PACK.md)
