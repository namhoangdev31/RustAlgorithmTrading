# Interface Release Gate 1 Spec W21

## 1) Contract freeze

W21 không đổi public wire contract. Canonical envelope vẫn là:

```json
{
  "schema_version": "v1.0.0",
  "correlation_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

## 2) Hard-gate1 record contract

Gate1 records tối thiểu phải có:

- `run_id`
- `suite_id`
- `suite_type` (`LINT`/`TYPE_STATIC`/`UNIT_BASELINE`)
- `disposition` (`PASS`/`FAIL`/`BLOCKED`)
- `reason_code`
- `component`
- `debt_item_id`
- `debt_status`
- `correlation_id`
- `evidence_ids`
- `owner`
- `eta`

## 3) Enforcement policy

- Missing `correlation_id` on critical gate events => `BLOCKED`.
- Missing debt mapping for failed suite => `BLOCKED`.
- Suite marked `PASS` without evidence capture => `BLOCKED`.

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
  - full lint/type/static/unit mandatory criteria đạt ngưỡng

## 5) Change record requirement

Mở `CR-W21-001` nếu có:

1. Thay đổi public response/event fields liên quan gate APIs.
2. Thay đổi behavior trading/risk/execution ngoài hard-gate1 scope.
3. Thay đổi wire-shape hoặc compatibility path.
