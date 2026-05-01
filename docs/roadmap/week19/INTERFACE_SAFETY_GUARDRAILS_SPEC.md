# Interface Safety Guardrails Spec W19

## 1) Contract freeze

W19 không đổi public wire contract. Canonical envelope vẫn là:

```json
{
  "schema_version": "v1.0.0",
  "correlation_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

## 2) Safety event contract

Safety guardrails records tối thiểu phải có:

- `run_id`
- `scenario_id`
- `trigger_type` (`KILL_SWITCH`/`RISK_OFF`/`ROLLBACK`)
- `disposition` (`PASS`/`FAIL`/`BLOCKED`)
- `reason_code`
- `component`
- `kill_switch_latency_ms`
- `risk_boundary`
- `rollback_required` (bool)
- `rollback_result`
- `correlation_id`
- `evidence_ids`
- `owner`
- `eta`

## 3) Enforcement policy

- Missing `correlation_id` on critical safety events => `BLOCKED`.
- Missing kill-switch timing for safety trigger => `BLOCKED`.
- Missing rollback result when `rollback_required=true` => `BLOCKED`.
- Risk boundary breached without mitigation evidence => `BLOCKED`.

## 4) Gate verdict contract

Allowed verdicts:

- `GO`
- `NO-GO`

Rules:

- Chỉ một verdict cuối trên toàn bộ artifacts.
- `GO` requires:
  - P0 open `=0`
  - P1 unowned `=0`
  - no mandatory `CAPTURED_FAIL/BLOCKED_ENV`
  - kill-switch/risk-off/rollback mandatory criteria đạt ngưỡng

## 5) Change record requirement

Mở `CR-W19-001` nếu có:

1. Thay đổi public response/event fields liên quan safety APIs.
2. Thay đổi behavior trading/risk/execution ngoài safety-guardrails scope.
3. Thay đổi wire-shape hoặc compatibility path.
