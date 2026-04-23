# Interface Spec Draft v0 (W01)

## Scope
Spec-only cho W02-W03. Không thay đổi production API trong W01.

## 1) ZMQ envelope with schema_version

```json
{
  "schema_version": "v1",
  "correlation_id": "string",
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
- `limit_snapshot` đủ để replay quyết định risk.

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
  "correlation_id": "string",
  "component": "market-data|signal-bridge|risk-manager|execution-engine|observability",
  "severity": "DEBUG|INFO|WARNING|ERROR|CRITICAL",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

Acceptance criteria:
- Có correlation continuity từ signal tới execution cho luồng smoke.
- Severity mapping thống nhất với logging policy.

## Test mapping for W02-W03
- Contract tests: validate required fields for all 4 payloads.
- Integration tests: verify schema handshake across Python <-> Rust.
- Observability tests: verify correlation coverage and severity semantics.

---
Last updated: W01 no-date mode sync
