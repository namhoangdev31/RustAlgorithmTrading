# Kế Hoạch Vận Hành Tuần 3 (Schema Versioning)

## 1) Mục tiêu tuần

Mục tiêu tuần 3 là triển khai thực thi `schema_version v1` trên boundary Python-Rust, đóng semantic drift từ tuần 2, và chuẩn hóa trace envelope để sẵn sàng cho tuần 4 (integration stabilization).

Kết quả bắt buộc cuối tuần:

1. Wire contract `v1` được khóa với acceptance criteria rõ.
2. Migration path `v0 -> v1` có backward-compat policy rõ ràng.
3. Contract test matrix (positive/negative/version mismatch) chạy được theo command profile chuẩn.
4. Báo cáo cuối tuần có quyết định Go/No-Go duy nhất, không mâu thuẫn artifact.

Ràng buộc tuần 3:

- Tuần 3 tập trung implementation contract, không mở rộng refactor ngoài integration-critical path.
- Mọi mismatch mới phải có `issue_id + owner + ETA + mitigation` trong 24h.
- Không bám mốc thời gian thực tế; dùng pha/ngày logic để tối đa throughput.

---

## 2) Task board theo pha/ngày logic (W3-T01 -> W3-T18)

### Pha 1: Freeze wire contract v1 + inventory migration

- `W3-T01` Freeze wire contract `schema_version v1` cho toàn bộ message boundary.
- `W3-T02` Chốt inventory migration cho các boundary Signal/Risk/Ack/Observability.
- `W3-T03` Chốt policy backward-compat cho `v0` legacy parse path.
- Đầu ra: `Schema Migration Plan v1`.

### Pha 2: Baseline schema tests

- `W3-T04` Chạy baseline tests cho positive contract validation.
- `W3-T05` Chạy negative cases: thiếu field/sai type/sai enum/sai timestamp.
- `W3-T06` Chạy version mismatch tests (`v0` permissive vs `v1` strict).
- Đầu ra: `Schema Version Baseline Report v1`.

### Pha 3: Implement spec mapping cho Signal/Risk/Ack/Observability

- `W3-T07` Chuẩn hóa Signal mapping: `action`, `confidence`, ISO timestamp.
- `W3-T08` Chuẩn hóa RiskDecision + ExecutionAck theo spec v1.
- `W3-T09` Chuẩn hóa ObservabilityEvent envelope (`trace_id/component/severity`).
- Đầu ra: `Interface Implementation Spec v1`.

### Pha 4: Triage mismatch + owner/ETA/mitigation

- `W3-T10` Triage mismatch theo cụm: schema/semantics/compat/observability/docs.
- `W3-T11` Gán severity, owner, ETA, mitigation cho từng mismatch.
- `W3-T12` Soát P0/P1 không để unowned và xung đột trạng thái.
- Đầu ra: `Issue Register v3`.

### Pha 5: Migration validation + compatibility notes

- `W3-T13` Validate migration `v0 -> v1` trên critical path.
- `W3-T14` Chốt compatibility notes cho local/dev/CI command profile.
- Đầu ra: cập nhật `Schema Migration Plan v1` + baseline evidence.

### Pha 6: Gate rehearsal

- `W3-T15` Chạy rehearsal checklist tuần 3.
- `W3-T16` Xác nhận gate conditions: contract tests pass + no P0 unowned + `W3-ISS-009 Done`.
- Đầu ra: `Gate Rehearsal Notes`.

### Pha 7: Final closeout + week4 pack

- `W3-T17` Xuất báo cáo cuối tuần 3.
- `W3-T18` Chốt Week-4 Start Pack cho integration stabilization.
- Đầu ra: `Week-3 Final Report + Week-4 Start Pack`.

---

## 3) Checklist vận hành

### Checklist hằng ngày

- Contract inventory được cập nhật khi có boundary mới.
- Có ít nhất 1 baseline/schema test batch được cập nhật trạng thái.
- Mismatch mới có severity + owner trong 24h.
- Không có issue P0 ở trạng thái unowned.
- Decision log cập nhật cuối pha.

### Checklist cuối tuần (bắt buộc pass)

- Có migration plan v1 với rule `v0 -> v1` rõ ràng.
- Có baseline report gồm positive/negative/version mismatch.
- Có issue register v3 đầy đủ `issue_id/severity/owner/ETA/mitigation`.
- Có implementation spec v1 cho 4 contract mục tiêu.
- Có final report tuần 3 với quyết định Go/No-Go duy nhất.

---

## 4) Issue tồn đọng khởi tạo tuần 3

### P0 (bắt buộc có owner trong tuần 3)

| ID | Issue | Tác động | Điều kiện đóng tuần 3 | Owner mặc định | Due |
|---|---|---|---|---|---|
| `W3-ISS-001` | `schema_version` v1 chưa được enforce nhất quán cross-runtime | Chặn contract rollout | V1 envelope enforce cho boundary critical path | `coder` | `Pha 2` |
| `W3-ISS-002` | Signal mapping drift (`direction/strength` vs `action/confidence`) | Chặn signal handoff ổn định | Signal payload đồng nhất và test pass | `coder` | `Pha 3` |
| `W3-ISS-003` | RiskDecision thiếu context chuẩn v1 | Chặn auditability/risk trace | Có `decision/reason_code/limit_snapshot` theo spec | `coder` | `Pha 3` |

### P1 (phải có kế hoạch xử lý)

| ID | Issue | Tác động | Điều kiện đóng tuần 3 | Owner mặc định | Due |
|---|---|---|---|---|---|
| `W3-ISS-004` | ExecutionAck telemetry chưa đủ (`latency_bucket/retry_count`) | Giảm chất lượng execution observability | Ack field chuẩn hóa và test pass | `reviewer` | `Pha 3` |
| `W3-ISS-005` | ObservabilityEvent envelope chưa đồng nhất (`trace_id/component/severity`) | Giảm traceability | Event envelope chuẩn hóa xuyên service | `ops` | `Pha 3` |
| `W3-ISS-006` | Version mismatch tests chưa phủ đủ negative paths | Risk regression khi migrate | Bộ negative tests tối thiểu pass | `tester` | `Pha 2` |
| `W3-ISS-009` | Compatibility policy version drift (`COMPATIBILITY_POLICY_V1.md` vs `rust/Cargo.toml`) | Rủi ro false-green khi rerun | Policy doc khớp version/feature hiện hành + có rule update khi bump dependency | `tester + planner` | `Pha 5` |

### P2 (theo dõi tuần sau)

| ID | Issue | Tác động | Điều kiện đóng tuần 3 | Owner mặc định | Due |
|---|---|---|---|---|---|
| `W3-ISS-007` | Canonical/doc drift sau schema updates | Nhiễu source-of-truth | Tạo backlog hygiene có mapping thay thế | `planner` | `Pha 7` |
| `W3-ISS-008` | Contract test matrix chưa mở rộng edge-case đầy đủ | Rủi ro coverage tuần 4 | Có expansion plan cho week4 integration | `tester` | `Pha 7` |

---

## 5) Test plan tuần 3 (schema-versioning focused)

Mục tiêu tuần 3 là triển khai contract v1 và xác nhận migration path an toàn.

Kịch bản bắt buộc:

1. Positive validation: payload v1 đủ field bắt buộc.
2. Negative validation: thiếu field/sai type/sai enum/sai timestamp.
3. Versioning checks: `v0` permissive parse path và `v1` strict parse path.
4. Cross-runtime handshake: Python -> Rust và Rust -> Python cho boundary critical.

Baseline commands tiêu chuẩn:

```bash
python -m pytest tests/integration/test_backtest_signal_flow.py -q
python -m pytest tests/integration/test_observability_integration.py -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge -p risk-manager -p execution-engine
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
```

Tiêu chí pass tuần 3:

- Contract test baseline pass theo command profile chuẩn.
- Không còn mismatch P0 unowned.
- `W3-ISS-009` ở trạng thái `Done`.
- Final report có quyết định Go/No-Go duy nhất.

---

## 6) Mẫu báo cáo cuối tuần (Week-3 Final Report)

### 1. Executive Summary

- Trạng thái tuần 3: `Go` hoặc `No-Go` vào tuần 4.
- 3 kết quả lớn nhất.
- 3 rủi ro lớn nhất.

### 2. KPI Snapshot

- Reliability / Contract Quality / Risk / Engineering / Observability.
- So sánh `Target tuần 3` vs `Actual`.

### 3. Delivery Status theo Task

- Trạng thái `W3-T01..W3-T18`: `Done/In progress/Blocked` + bằng chứng.

### 4. Issue Register

- Danh sách P0/P1/P2, owner, ETA, mitigation, dependency.

### 5. Decision Log

- Quyết định đã chốt cho tuần 4.
- Giả định còn mở cần xác nhận.

### 6. Week-4 Start Pack

- Top 5 task ưu tiên tuần 4.
- Điều kiện khởi động integration stabilization.

---

## 7) KPI dictionary khuyến nghị cho tuần 3

### Reliability

- Contract rerun stability theo pha.
- P0/P1 contract mismatch count.
- MTTR cho schema blockers.

### Contract Quality

- V1 envelope compliance coverage.
- Migration success rate (`v0 -> v1`).
- Mismatch closure rate theo severity.

### Risk

- RiskDecision completeness coverage (`reason_code/limit_snapshot`).
- Risk semantics mismatch count.
- Reject/allow consistency theo test scenarios.

### Engineering quality

- Contract-focused unit/integration pass rate.
- Build stability theo command profile chuẩn.
- Regression count sau schema mapping updates.

### Observability

- `trace_id` coverage trên critical path.
- Event envelope completeness (`component/severity/timestamp`).
- Severity mapping consistency cross-service.

---

## 8) Assumptions & defaults

- Không bám lịch thực tế; vận hành theo pha/ngày logic.
- Tuần 3 ưu tiên implementation contract, không mở rộng refactor lớn.
- Mọi mismatch phải trace về issue register trong 24h.
- Kế hoạch bám nguyên tắc `Doc -> Code -> Test`.

---

Last updated: 2026-04-23

## Execution artifacts (Week 3)

Artifacts được tạo để vận hành thực tế tuần 3:

- [week3/KPI_CHARTER_V3.md](week3/KPI_CHARTER_V3.md)
- [week3/SCHEMA_VERSION_BASELINE_REPORT_V1.md](week3/SCHEMA_VERSION_BASELINE_REPORT_V1.md)
- [week3/SCHEMA_MIGRATION_PLAN_V1.md](week3/SCHEMA_MIGRATION_PLAN_V1.md)
- [week3/ISSUE_REGISTER_V3.md](week3/ISSUE_REGISTER_V3.md)
- [week3/INTERFACE_IMPLEMENTATION_SPEC_V1.md](week3/INTERFACE_IMPLEMENTATION_SPEC_V1.md)
- [week3/GATE_REHEARSAL_NOTES.md](week3/GATE_REHEARSAL_NOTES.md)
- [week3/WEEK3_FINAL_REPORT_AND_WEEK4_START_PACK.md](week3/WEEK3_FINAL_REPORT_AND_WEEK4_START_PACK.md)
