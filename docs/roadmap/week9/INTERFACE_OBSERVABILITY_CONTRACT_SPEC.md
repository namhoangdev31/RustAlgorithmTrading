# Interface Observability Contract Spec (Week 9)

## 1) Contract freeze

Public envelope giữ nguyên:

```json
{
  "schema_version": "v1.0.0",
  "correlation_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

W09 không đổi public wire-shape. Nếu cần đổi internal logging/helper API để truyền taxonomy hoặc correlation context, mở `CR-W09-001` nhưng không đổi public envelope.

## 2) Observability event schema

Mọi critical observability event cần có:

- `schema_version` nếu event đi qua public envelope.
- `correlation_id` nếu event scoped theo request/order/signal/risk/execution/alert.
- `event_type`.
- `timestamp` ISO-8601.
- `component`.
- `severity`.
- `payload`.
- `reason_code` khi event là reject/error/state transition.
- `disposition` khi event biểu thị allow/retry/reject/drop-safe/closed/open.

## 3) Component taxonomy

Canonical component tokens:

- `python.bridge`
- `python.strategy`
- `python.backtesting`
- `python.observability`
- `rust.market_data`
- `rust.signal_bridge`
- `rust.risk_manager`
- `rust.execution_engine`
- `rust.common`
- `ops.health`
- `ops.alerting`

## 4) Severity taxonomy

- `DEBUG`: diagnostic only.
- `INFO`: normal lifecycle event.
- `WARN`: recoverable degradation or guardrail reject.
- `ERROR`: failed operation requiring action.
- `CRITICAL`: risk/live safety issue; alert false-negative must be `0`.

## 5) Reason/disposition taxonomy

Reuse canonical reason/disposition tokens from W05-W08 where applicable:

- Risk: `LIMIT_EXCEEDED`, `CIRCUIT_BREAKER_TRIPPED`, `STOP_LOSS_TRIGGERED`, `DAILY_LOSS`, `MANUAL`, `EMERGENCY`.
- Execution: `NETWORK_TRANSIENT`, `RATE_LIMIT`, `EXCHANGE_5XX`, `SLIPPAGE_BREACH`, `ORDER_VALIDATION`, `MAX_ATTEMPTS_EXHAUSTED`.
- Disposition: `ALLOW`, `RETRY`, `REJECT`, `DROP_SAFE`, `OPEN`, `CLOSED`, `RESET_PENDING`, `HALF_OPEN`.

## 6) Critical event list

| Event | Required metadata | Gate evidence |
|---|---|---|
| Signal | `correlation_id`, `event_type`, `component`, `severity` | `EV-W9-201` |
| RiskDecision | `correlation_id`, `decision`, `reason_code`, `disposition` | `EV-W9-206`,`EV-W9-211` |
| StopLossTrigger | `correlation_id`, `stop_type`, `reason_code`, `disposition` | `EV-W9-212` |
| CircuitBreakerTransition | `correlation_id`, `previous_state`, `next_state`, `reason_code`, `disposition` | `EV-W9-213` |
| RetryAttempt | `correlation_id`, `client_order_id`, `attempt`, `reason_code`, `disposition` | `EV-W9-214` |
| SlippageReject | `correlation_id`, `slippage_bps`, `reason_code`, `disposition` | `EV-W9-214` |
| ExecutionAck | `correlation_id`, `order_id`, `route`, `latency_bucket`, `retry_count` | `EV-W9-214` |
| HealthStatus | `component`, `status`, `severity` | `EV-W9-107`,`EV-W9-302` |
| Alert | `component`, `severity`, `reason_code`, `source_event_id` | `EV-W9-209`,`EV-W9-210` |

## 7) File-level edit contract

| File/path | Allowed change | Forbidden change |
|---|---|---|
| `src/observability/logging/*` | schema/taxonomy/correlation/redaction hardening | emit raw secrets or create public secondary IDs |
| `src/observability/metrics/*` | collector schema adapters and labels | change trading decisions |
| `src/observability/api/routes/*` | stable response adapters | breaking API output without `CR-W09-001` |
| `src/observability/dashboard/src/*` | consume canonical fields | invent dashboard-only event contract |
| `rust/common/src/metrics.rs` | internal metric labels/tests | break existing metric names without adapter |
| `rust/common/src/health.rs` | component health metadata | break health endpoint shape without CR |
| `scripts/compliance_audit.sh` | stronger audit checks | pass missing critical fields |
| `scripts/audit_correlation.py` | stronger source scan | scan generated/build artifacts |

## 8) Error-handling protocol

- Không panic.
- Missing critical observability metadata phải fail test/audit, không silently pass.
- Redaction leak là gate blocker P0.
- Alert critical false-negative là gate blocker P1/P0 tùy impact.
- Log/event preview nếu có phải redacted và bounded.
