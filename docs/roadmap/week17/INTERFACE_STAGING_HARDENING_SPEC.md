# Interface Staging Hardening Spec W17

## 1) Contract freeze

W17 không đổi public wire contract. Canonical envelope vẫn là:

```json
{
  "schema_version": "v1.0.0",
  "correlation_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

## 2) Staging event contract

Staging hardening records tối thiểu phải có:

- `run_id`
- `scenario_id`
- `disposition` (`PASS`/`FAIL`/`BLOCKED`)
- `reason_code`
- `component`
- `correlation_id`
- `evidence_ids`
- `owner`
- `eta`

## 3) Enforcement policy

- Missing `correlation_id` on critical staging events => `BLOCKED`.
- Missing rollback evidence for rollback-required scenarios => `BLOCKED`.
- Kill-switch metric không có timestamp/latency => `BLOCKED`.

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
  - soak/kill-switch/rollback criteria đạt ngưỡng

## 5) Change record requirement

Mở `CR-W17-001` nếu có:

1. Thay đổi public response/event fields liên quan staging APIs.
2. Thay đổi behavior trading/risk/execution ngoài hardening scope.
3. Thay đổi wire-shape hoặc compatibility path.
