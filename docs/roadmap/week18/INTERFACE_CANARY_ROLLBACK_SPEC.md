# Interface Canary & Rollback Spec W18

## 1) Contract freeze

W18 không đổi public wire contract. Canonical envelope vẫn là:

```json
{
  "schema_version": "v1.0.0",
  "correlation_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

## 2) Canary rehearsal record contract

Canary rehearsal records tối thiểu:

- `run_id`
- `scenario_id`
- `canary_tier`
- `risk_boundary`
- `disposition` (`PASS`/`FAIL`/`BLOCKED`)
- `reason_code`
- `rollback_required` (bool)
- `rollback_result`
- `kill_switch_latency_ms`
- `correlation_id`
- `evidence_ids`
- `owner`
- `eta`

## 3) Enforcement policy

- Missing rollback result when `rollback_required=true` => `BLOCKED`.
- Missing kill-switch timing on breach scenario => `BLOCKED`.
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
  - canary scenario + rollback mandatory criteria đạt ngưỡng

## 5) Change record requirement

Mở `CR-W18-001` nếu có:

1. Thay đổi public response/event fields liên quan canary/rollback APIs.
2. Thay đổi behavior trading/risk/execution ngoài canary-design scope.
3. Thay đổi wire-shape hoặc compatibility path.
