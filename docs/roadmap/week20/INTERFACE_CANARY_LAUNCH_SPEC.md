# Interface Canary Launch Spec W20

## 1) Contract freeze

W20 không đổi public wire contract. Canonical envelope vẫn là:

```json
{
  "schema_version": "v1.0.0",
  "correlation_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

## 2) Canary launch record contract

Controlled canary launch records tối thiểu phải có:

- `run_id`
- `scenario_id`
- `launch_tier`
- `risk_boundary`
- `disposition` (`PASS`/`FAIL`/`BLOCKED`)
- `reason_code`
- `component`
- `kill_switch_latency_ms`
- `rollback_required` (bool)
- `rollback_result`
- `escalation_state`
- `escalation_result`
- `correlation_id`
- `evidence_ids`
- `owner`
- `eta`

## 3) Enforcement policy

- Missing `correlation_id` on critical launch events => `BLOCKED`.
- Missing escalation result for breach scenario => `BLOCKED`.
- Missing rollback result when `rollback_required=true` => `BLOCKED`.
- Risk boundary exceeded without mitigation evidence => `BLOCKED`.

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
  - canary launch mandatory criteria đạt ngưỡng

## 5) Change record requirement

Mở `CR-W20-001` nếu có:

1. Thay đổi public response/event fields liên quan canary launch APIs.
2. Thay đổi behavior trading/risk/execution ngoài canary-launch scope.
3. Thay đổi wire-shape hoặc compatibility path.
