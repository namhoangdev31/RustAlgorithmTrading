# Interface Release Gate 3 Spec W23

## 1) Contract freeze

W23 khong doi public wire contract. Canonical envelope van la:

```json
{
  "schema_version": "v1.0.0",
  "correlation_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

## 2) Hard-gate3 record contract

Gate3 records toi thieu phai co:

- `run_id`
- `suite_id`
- `suite_type` (`CROSS_RUNTIME`, `E2E`, `SOAK`, `FAULT_INJECTION`)
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
- Fault scenario without recovery disposition => `BLOCKED`.

## 4) Gate verdict contract

Allowed verdicts:

- `GO`
- `NO-GO`

Rules:

- Chi mot verdict cuoi tren toan bo artifacts.
- `GO` requires:
  - P0 open `=0`
  - P1 unowned `=0`
  - no mandatory `CAPTURED_FAIL/BLOCKED_ENV`
  - full cross-runtime/e2e/soak/fault mandatory criteria dat nguong

## 5) Change record requirement

Mo `CR-W23-001` neu co:

1. Thay doi public response/event fields lien quan gate APIs.
2. Thay doi behavior trading/risk/execution ngoai hard-gate3 scope.
3. Thay doi wire-shape hoac compatibility path.
