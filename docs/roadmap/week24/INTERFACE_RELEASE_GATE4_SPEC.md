# Interface Release Gate 4 Spec W24

## 1) Contract freeze

W24 khong doi public wire contract. Canonical envelope van la:

```json
{
  "schema_version": "v1.0.0",
  "correlation_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

## 2) Hard-gate4 record contract

Gate4 records toi thieu phai co:

- `run_id`
- `suite_id`
- `suite_type` (`FULL_REGRESSION`, `RELEASE_GATE`, `ROLLBACK_READINESS`, `FINAL_APPROVAL`)
- `disposition` (`PASS`/`FAIL`/`BLOCKED`)
- `reason_code`
- `component`
- `release_blocker_id`
- `approval_status`
- `correlation_id`
- `evidence_ids`
- `owner`
- `eta`

## 3) Enforcement policy

- Missing `correlation_id` on critical release events => `BLOCKED`.
- Missing release blocker mapping for failed suite => `BLOCKED`.
- Release gate marked `PASS` without evidence capture => `BLOCKED`.
- Final approval without artifact consistency evidence => `BLOCKED`.

## 4) Gate verdict contract

Allowed verdicts:

- `GO`
- `NO-GO`

Rules:

- Chi mot verdict cuoi tren toan bo artifacts.
- `GO` requires:
  - P0 open `=0`
  - P1 unowned `=0`
  - release blockers `=0`
  - no mandatory `CAPTURED_FAIL/BLOCKED_ENV`
  - full regression + controlled live ready + final approval criteria dat nguong

## 5) Change record requirement

Mo `CR-W24-001` neu co:

1. Thay doi public response/event fields lien quan release gate APIs.
2. Thay doi behavior trading/risk/execution ngoai release-gate scope.
3. Thay doi wire-shape hoac compatibility path.
