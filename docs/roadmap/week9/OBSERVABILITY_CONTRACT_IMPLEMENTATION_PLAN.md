# Observability Contract Implementation Plan (Week 9)

## Summary

Triển khai Observability Contract theo hướng thay đổi tối thiểu, tập trung structured logging schema, correlation continuity, Rust metrics/health metadata, dashboard/API schema alignment, redaction và alert readiness evidence.

## File-level implementation guide

| File | Cần sửa nếu evidence fail | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `src/observability/logging/structured_logger.py` | schema fields, correlation propagation, severity mapping | helper taxonomy nếu cần | đổi behavior trading để làm đẹp log | structured logger tests + correlation audit | `EV-W9-201..206`,`EV-W9-301` |
| `src/observability/logging/formatters.py` | JSON/structured formatter parseability | reason/disposition normalization nếu cần | bỏ redaction hiện có | parseability + redaction tests | `EV-W9-204`,`EV-W9-207` |
| `src/observability/logging/redaction_handler.py` | sensitive field coverage | update sensitive keys nếu leak | log raw secret/account data | redaction leak count `0` | `EV-W9-207`,`EV-W9-304` |
| `src/observability/logging/decorators.py` | ensure function/span logs preserve `correlation_id` | component/operation metadata if needed | tạo ID phụ public | correlation audit | `EV-W9-201`,`EV-W9-202` |
| `src/observability/metrics/*` | component labels, execution/risk metrics mapping | collector schema adapter nếu needed | rename public dashboard fields without adapter | observability integration | `EV-W9-208`,`EV-W9-303` |
| `src/observability/api/routes/*` | API response schema stability | compatibility alias internally if needed | đổi API output shape thiếu CR | API tests | `EV-W9-101`,`EV-W9-303` |
| `src/observability/dashboard/src/*` | consume stable fields and panel availability | dashboard schema guard if needed | invent dashboard-only schema | dashboard/API checks | `EV-W9-208`,`EV-W9-303` |
| `rust/common/src/metrics.rs` | component/label coverage | metric label tests if needed | label drift phá dashboards | cargo test common | `EV-W9-104`,`EV-W9-302` |
| `rust/common/src/health.rs` | component health metadata | health metadata tests if needed | change health public shape without CR | common tests + health check | `EV-W9-107`,`EV-W9-302` |
| `scripts/compliance_audit.sh` | coverage/redaction checks if too weak | additional W09 mode if needed | pass giả khi log missing | compliance audit | `EV-W9-108` |
| `scripts/audit_correlation.py` | critical event/source detection if too weak | include execution/risk/bridge paths | scan irrelevant generated files | source audit `0 findings` | `EV-W9-109` |
| `PLAYBOOK.md` | sync file mapping khi tạo file mới | file role/test mapping | bỏ qua file mới | doc/code/test mapping | `EV-W9-402` |

## Dependency matrix

| Lane | Depends on | Unlocks | Hard stop if fail |
|---|---|---|---|
| Lane 1: Logging schema | baseline evidence | correlation coverage rollout | structured logs cannot parse |
| Lane 2: Correlation continuity | Lane 1 | dashboard/API sync | missing critical `correlation_id` |
| Lane 3: Metrics/health metadata | Lane 1 | alert readiness | component/source unknown |
| Lane 4: Dashboard/API schema sync | Lanes 1-3 | W10 SLO setup | critical panels unavailable |
| Lane 5: Redaction/alert rehearsal | Lanes 1-4 | final gate | redaction leak or critical alert miss |

## Critical event taxonomy

| Event | Required fields |
|---|---|
| Signal | `schema_version`, `correlation_id`, `event_type`, `timestamp`, `component`, `severity`, `payload` |
| RiskDecision | `correlation_id`, `component`, `decision`, `reason_code`, `disposition`, `severity` |
| StopLossTrigger | `correlation_id`, `component`, `stop_type`, `reason_code`, `disposition`, `severity` |
| CircuitBreakerTransition | `correlation_id`, `component`, `previous_state`, `next_state`, `reason_code`, `disposition` |
| RetryAttempt | `correlation_id`, `component`, `client_order_id`, `attempt`, `reason_code`, `disposition` |
| SlippageReject | `correlation_id`, `component`, `client_order_id`, `slippage_bps`, `reason_code`, `disposition` |
| ExecutionAck | `correlation_id`, `component`, `order_id`, `route`, `latency_bucket`, `retry_count`, `disposition` |
| HealthStatus | `correlation_id` if request/event scoped, `component`, `status`, `severity` |
| Alert | `correlation_id` if event scoped, `component`, `severity`, `reason_code`, `source_event_id` |

## Severity policy

| Severity | Meaning | Gate concern |
|---|---|---|
| `DEBUG` | diagnostic only | never alert by itself |
| `INFO` | normal lifecycle event | dashboard/trace only |
| `WARN` | recoverable degradation or guardrail reject | alert candidate if repeated |
| `ERROR` | failed operation requiring action | alert candidate |
| `CRITICAL` | risk/live safety issue | must alert, false-negative `=0` |

## Redaction policy

Must redact or suppress in public logs/events:

- API keys, tokens, secrets.
- account id, buying power, full account snapshot unless explicitly internal-only.
- `limit_snapshot` and strategy-sensitive risk config details in public path.
- raw payload preview beyond approved redacted preview.

## Rollback strategy

| Lane | Rollback trigger | Rollback action | Evidence |
|---|---|---|---|
| Logging schema | parser/test failures or downstream dashboard break | revert formatter/helper only, retain failing fixture | rerun `EV-W9-204`,`EV-W9-301` |
| Correlation continuity | ID propagation breaks behavior | revert propagation patch, keep audit finding | rerun `EV-W9-201..202` |
| Metrics/health metadata | dashboards/metrics labels drift | revert label change, add adapter if needed | rerun `EV-W9-302..303` |
| Redaction | leak detected | block gate, patch redaction handler first | rerun `EV-W9-207`,`EV-W9-304` |
| Alert rehearsal | critical false-negative | keep W09 `NO-GO`, add recovery queue | rerun `EV-W9-209..210` |

## Lane outcomes (initial)

| Lane | Outcome | Status | Evidence |
|---|---|---|---|
| Lane 1 | Logging schema | `PENDING_EXECUTION` | `EV-W9-204..206`,`EV-W9-301` |
| Lane 2 | Correlation continuity | `PENDING_EXECUTION` | `EV-W9-201..203` |
| Lane 3 | Metrics/health metadata | `PENDING_EXECUTION` | `EV-W9-104`,`EV-W9-302` |
| Lane 4 | Dashboard/API schema sync | `PENDING_EXECUTION` | `EV-W9-101`,`EV-W9-208`,`EV-W9-303` |
| Lane 5 | Redaction/alert/artifact reconciliation | `PENDING_EXECUTION` | `EV-W9-207`,`EV-W9-304..306` |
