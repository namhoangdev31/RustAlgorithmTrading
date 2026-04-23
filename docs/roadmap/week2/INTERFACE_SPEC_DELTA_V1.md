# Interface Spec Delta v1 (Week 2)

## Scope
Tài liệu delta contract cho tuần 2 (audit/spec/policy). Không áp dụng thay đổi production API trực tiếp trong tuần 2.

## 1) ZMQ envelope + schema version policy

Target envelope (`v1`):

```json
{
  "schema_version": "v1",
  "trace_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

Delta/Policy:
- `schema_version` là field bắt buộc với mọi message liên service ở contract mới.
- Cho phép đọc legacy `v0` theo compatibility note; mọi mismatch phải log + map issue.
- Tuần 3 là mốc triển khai migration/version enforcement.

## 2) RiskDecision delta

```json
{
  "decision": "approve|reject",
  "reason_code": "string",
  "limit_snapshot": {
    "symbol_limit": "number",
    "portfolio_limit": "number",
    "current_exposure": "number"
  }
}
```

Delta/Policy:
- Reject path bắt buộc có `reason_code`.
- `limit_snapshot` phải đủ dữ liệu để replay/audit quyết định risk.
- Nếu thiếu field bắt buộc: classify mismatch `semantics` hoặc `schema`.

## 3) ExecutionAck delta

```json
{
  "order_id": "string",
  "route": "string",
  "latency_bucket": "<50us|50-100us|100-500us|>500us",
  "retry_count": 0
}
```

Delta/Policy:
- `order_id` unique per ack.
- `latency_bucket` và `retry_count` là telemetry bắt buộc cho audit traceability.
- Ack thiếu telemetry fields được đánh dấu mismatch P1.

## 4) ObservabilityEvent delta

```json
{
  "trace_id": "string",
  "component": "market-data|signal-bridge|risk-manager|execution-engine|observability",
  "severity": "DEBUG|INFO|WARNING|ERROR|CRITICAL",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

Delta/Policy:
- Chuẩn hóa mapping `component` và `severity` giữa các service.
- Bắt buộc trace continuity cho luồng smoke signal -> execution.
- Event thiếu `trace_id` hoặc `severity` được gắn mismatch `observability`.

## 5) Compatibility policy (PyO3/Python)

- Chuẩn runtime policy phải chỉ định rõ local/dev/CI command profile.
- Nếu cần compatibility flag cho PyO3, policy phải nêu rõ phạm vi áp dụng và command chuẩn.
- Mọi command baseline trong report tuần 2 phải rerun được theo policy này.

## Test mapping for Week 2-3
- Contract tests: validate required fields cho cả 4 contract types.
- Negative tests: thiếu field, sai type, version mismatch.
- Integration tests: verify handshake Python <-> Rust cho boundary critical.
- Observability tests: verify trace/severity completeness theo envelope mới.

---
Last updated: 2026-04-23
