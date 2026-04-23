# Interface Implementation Spec (Week 3 One-pass)

## 1) Wire envelope contract

```json
{
  "schema_version": "v1.0.0",
  "correlation_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

### Required fields
- `schema_version`
- `correlation_id`
- `event_type`
- `timestamp`
- `payload`

## 2) File-level Edit Contract

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `src/bridge/zmq_bridge.py` | Parse `envelope -> payload`; validate required fields; normalize legacy field `direction/strength -> action/confidence` | Structured reject object khi mismatch và warning marker cho legacy path | Không crash pipeline; không drop im lặng | parser unit + Python->Rust integration | `EV-W3-201`,`EV-W3-206` |
| `rust/common/src/messaging.rs` | Envelope parser 2 bước; schema validation; typed error mapping | Compatibility adapter + payload preview redacted (`<=200`) + malformed/UTF-8 quarantine | Không panic khi parse fail | Rust parser tests + Rust->Python integration | `EV-W3-203`,`EV-W3-207` |
| `src/observability/logging/structured_logger.py` + decorators liên quan | Đồng bộ context key `correlation_id`, `schema_version`, `event_type` | Mismatch log triage chuẩn (`error_code`,`reason`,`disposition`,`payload_preview`) | Không log raw payload đầy đủ nếu có dữ liệu nhạy cảm | observability integration + shadow audit | `EV-W3-208`,`EV-W3-210` |

## 3) Data contract mapping

### Signal
- `action`: required
- `confidence`: required
- `timestamp`: ISO-8601 required

### RiskDecision
- `decision`: required
- `reason_code`: required
- `limit_snapshot`: required

### ExecutionAck
- `order_id`: required
- `route`: required
- `latency_bucket`: required
- `retry_count`: required

### ObservabilityEvent
- `correlation_id`: required
- `component`: required
- `severity`: required
- `timestamp`: required
- `payload`: required

## 4) Error-handling protocol

```json
{
  "error_code": "string",
  "correlation_id": "string",
  "reason": "string",
  "disposition": "DROP_SAFE|RETRY|QUARANTINE",
  "payload_preview": "string<=200(redacted)"
}
```

### Runtime rules
1. `No panic`: mọi contract mismatch phải trả lỗi có cấu trúc.
2. `Drop-safe`: reject message an toàn, không làm treo queue.
3. `Traceable`: error log bắt buộc có `correlation_id` + `schema_version` + `error_code`.
4. `Raw payload context`: log tối đa 200 ký tự đầu của payload đã redaction để triage nhanh.
5. `Extreme negative policy`: malformed JSON và invalid UTF-8 phải trả `disposition=QUARANTINE`, không được crash parser.

## 5) Transition policy (one-pass, low-chaos)
1. Public wire shape chỉ có một contract chính (`schema_version: v1.0.0`).
2. Legacy parse path chỉ dùng nội bộ bridge để normalize, không public thêm contract mới.
3. Bất kỳ thay đổi field nào phải map trực tiếp vào testcase unit + integration trước khi merge.

---
Last updated: W03 no-date mode sync
