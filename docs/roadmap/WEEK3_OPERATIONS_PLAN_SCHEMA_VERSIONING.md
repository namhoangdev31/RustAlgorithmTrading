# Kế Hoạch Vận Hành Tuần 3 (Schema Versioning)

## 1) Mục tiêu tuần

Tuần 3 là **Implementation Week**: triển khai thực thi `schema_version v1` trên boundary Python-Rust, đóng semantic drift từ tuần 2, và chuẩn hóa trace envelope để sẵn sàng tuần 4.

Kết quả bắt buộc:

1. Contract `v1` được khóa ở mức wire-shape + runtime behavior.
2. Migration path `v0 -> v1` có compatibility policy + rollback rule rõ ràng.
3. Baseline test matrix có evidence capture cho positive/negative/versioning.
4. Gate kết luận **duy nhất** theo rule chuẩn, không mâu thuẫn artifact.

Chuẩn trạng thái tuần 3:

- Mặc định: `NO-GO có điều kiện`.
- Chỉ được set `GO` khi **đồng thời**:
  1. Không còn P0 ở `NEW/IN_PROGRESS/BLOCKED`.
  2. `W3-ISS-009` ở `DONE`.
  3. Toàn bộ test scenario bắt buộc có evidence `CAPTURED_PASS`.

---

## 2) Taxonomy & Evidence chuẩn (bắt buộc dùng xuyên suốt)

### Issue/Task status

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
- Mọi kết luận `PASS/DONE/GO` phải map ít nhất 1 `Evidence ID` hợp lệ.

### Clean-slate rule

Evidence chỉ hợp lệ nếu chạy trên clean-slate:

```bash
find . -name "__pycache__" -exec rm -rf {} +
cd rust && cargo clean -p common -p signal-bridge -p risk-manager -p execution-engine
```

Ghi rõ `clean_slate=true/false` trong baseline report.

---

## 3) Task board theo pha (W3-T01 -> W3-T18)

### Pha 1: Freeze contract + inventory

- `W3-T01` Freeze envelope v1 và policy `v1 strict / v0 permissive`.
- `W3-T02` Chốt inventory boundary Signal/Risk/Ack/Observability.
- `W3-T03` Chốt rollback trigger/action cho từng lane.

**Phase gate 1->2**

- Có migration plan chứa lane dependency + rollback matrix.

### Pha 2: Baseline & negative tests (không được vượt rào)

- `W3-T04` Positive validation.
- `W3-T05` Negative validation: missing field, wrong type, wrong enum, wrong timestamp.
- `W3-T06` Versioning validation: `v0` compatibility path và `v1` strict path.

**Phase gate 2->3**

- Mọi scenario parser bắt buộc đã có evidence capture (không còn `PENDING_EXECUTION`).

### Pha 3: Mapping implementation

- `W3-T07` Signal mapping (`direction/strength` -> `action/confidence`, int -> ISO-8601).
- `W3-T08` RiskDecision + ExecutionAck mapping.
- `W3-T09` Observability tracing mapping (`correlation_id` -> `trace_id`, compatibility alias).

**Phase gate 3->4**

- Lane dependency được tôn trọng; lane sau không merge khi lane trước chưa pass.

### Pha 4: Triage mismatch

- `W3-T10` Triage mismatch theo cụm.
- `W3-T11` Gán severity/owner/ETA/mitigation/evidence.
- `W3-T12` Soát blocker và dependency chéo.

### Pha 5: Migration validation

- `W3-T13` Validate `v0 -> v1` critical path.
- `W3-T14` Chốt compatibility notes cho local/dev/CI.

### Pha 6: Gate rehearsal

- `W3-T15` Gate checklist + evidence check.
- `W3-T16` Kết luận `NO-GO có điều kiện` hoặc `GO` theo rule cứng.

### Pha 7: Final closeout

- `W3-T17` Final report tuần 3.
- `W3-T18` Week-4 start pack map từ blocker còn mở.

---

## 4) Implementation Guide (Doc -> Code -> Test)

### 4.1 Bridge Python-Rust

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `src/bridge/zmq_bridge.py` | Parse `envelope -> payload`, normalize v0->v1 (`direction/strength` -> `action/confidence`) | Structured error (`error_code`, `trace_id`, `reason`) | Không crash/panic, không bỏ qua lỗi im lặng | parser positive/negative/versioning + Python->Rust integration | `EV-W3-1xx` |
| `rust/common/src/messaging.rs` | Envelope parser strict v1 + compatibility v0 | Structured parse error + safe drop policy | Không dùng parse mơ hồ gây deserialize crash | Rust unit parser tests + cross-runtime contract test | `EV-W3-1xx` |

### 4.2 Models/Types contract

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| Boundary Signal/Risk/Ack types | Signal: `action`, `confidence`, timestamp ISO; RiskDecision: `reason_code`, `limit_snapshot`; ExecutionAck: telemetry fields | Compatibility adapter cho transition window | Không đổi wire-shape tùy ý ngoài spec | Unit test từng contract + integration handshake | `EV-W3-2xx` |

### 4.3 Observability tracing

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| Logger/decorators Python + Rust logging path | Chuẩn `trace_id` xuyên suốt; `correlation_id` chỉ alias | Mismatch log phải chứa `trace_id`, `error_code`, raw payload preview <=200 ký tự (redacted) | Không log dữ liệu nhạy cảm chưa redaction | Observability unit + integration log schema checks | `EV-W3-3xx` |

### 4.4 Validation suite

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| Contract test suite tuần 3 | Bổ sung đầy đủ negative/versioning path | Mapping testcase -> issue_id -> gate item | Không dùng placeholder return/pass giả | Positive/Negative/Versioning/Cross-runtime/Observability | `EV-W3-4xx` |

---

## 5) Error-handling protocol (bắt buộc)

1. `no panic` trên mismatch contract/version.
2. Trả lỗi có cấu trúc: `error_code`, `trace_id`, `reason`, `disposition`.
3. `disposition` mặc định: `DROP_SAFE` + issue mapping.
4. Log kèm raw payload preview tối đa 200 ký tự, bắt buộc redaction dữ liệu nhạy cảm.

---

## 6) Test plan tuần 3 (schema-focused)

### Nhóm bắt buộc

1. Positive: v1 payload hợp lệ.
2. Negative: thiếu field/sai type/sai enum/sai timestamp.
3. Versioning: `v0` legacy parse path và `v1` strict path.
4. Cross-runtime: Python publish -> Rust consume, Rust emit -> Python parse.
5. Observability: log contract mismatch có `trace_id` + structured error.

### Baseline commands

```bash
python -m pytest tests/integration/test_backtest_signal_flow.py -q
python -m pytest tests/integration/test_observability_integration.py -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge -p risk-manager -p execution-engine
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
```

### Acceptance

- Không ghi `Done/Pass` nếu chưa có `Evidence ID`.
- Gate mặc định giữ `NO-GO có điều kiện` cho tới khi mọi điều kiện pass đồng thời.

---

## 7) Assumptions & defaults

- Tuần 3 là implementation-critical path, không mở rộng refactor ngoài schema/integration.
- Mọi mismatch mới phải map vào issue register trong 24h với `owner + ETA + mitigation`.
- Toàn bộ artifact tuần 3 phải dùng đúng taxonomy/evidence chuẩn ở mục 2.

---
Last updated: 2026-04-23
