# Interface Spec Draft v0 (Week 1)

## Scope
Spec-only cho tuần 2-3. Không thay đổi production API trong tuần 1.

## 1) ZMQ envelope with schema_version

```json
{
  "schema_version": "v1",
  "trace_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

Acceptance criteria:
- Mọi message liên service phải có `schema_version`.
- Consumer reject message nếu thiếu `schema_version`.
- Có compatibility note cho `v0` legacy payload.

## 2) RiskDecision

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

Acceptance criteria:
- Mọi reject đều có `reason_code`.
- `limit_snapshot` phải đủ để replay quyết định risk.

## 3) ExecutionAck

```json
{
  "order_id": "string",
  "route": "string",
  "latency_bucket": "<50us|50-100us|100-500us|>500us",
  "retry_count": 0
}
```

Acceptance criteria:
- `order_id` unique per ack.
- `retry_count` phản ánh thực tế retry policy.

## 4) ObservabilityEvent

```json
{
  "trace_id": "string",
  "component": "market-data|signal-bridge|risk-manager|execution-engine|observability",
  "severity": "DEBUG|INFO|WARNING|ERROR|CRITICAL",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

Acceptance criteria:
- Có trace continuity từ signal đến execution cho luồng smoke.
- Severity mapping thống nhất với logging policy.

## Test mapping for Week 2-3
- Contract tests: validate required fields for all 4 payloads.
- Integration tests: verify schema handshake across Python <-> Rust.
- Observability tests: verify trace coverage and severity semantics.

---
Last updated: 2026-04-14
