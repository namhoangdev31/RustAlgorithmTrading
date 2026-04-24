# Observability Baseline Report (Week 9)

## Taxonomy

- Task/Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`
- Initial Week 9 evidence status: `PENDING_EXECUTION`

## Baseline preflight

| Check | Command | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| Observability unit preflight | `python -m pytest tests/observability -q` | observability tests runnable | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-001` |
| Observability integration preflight | `python -m pytest tests/integration/test_observability_integration.py -q` | observability integration runnable | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-002` |
| Correlation audit preflight | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-003` |

## Command evidence set

| Command group | Command | Expected | Actual | Status | Mapped issue | Evidence ID |
|---|---|---|---|---|---|---|
| Python observability tests | `python -m pytest tests/observability -q` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W9-ISS-002`,`W9-ISS-003`,`W9-ISS-005` | `EV-W9-101` |
| Python observability integration | `python -m pytest tests/integration/test_observability_integration.py -q` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W9-ISS-001`,`W9-ISS-002`,`W9-ISS-005` | `EV-W9-102` |
| Python signal flow regression | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W9-ISS-007` | `EV-W9-103` |
| Rust common tests | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W9-ISS-010` | `EV-W9-104` |
| Rust execution/risk regression | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p execution-engine -p risk-manager` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W9-ISS-007` | `EV-W9-105` |
| Rust workspace check | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W9-ISS-011` | `EV-W9-106` |
| Runtime health | `bash scripts/health_check.sh` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W9-ISS-005` | `EV-W9-107` |
| Compliance audit | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W9-ISS-001`,`W9-ISS-003` | `EV-W9-108` |
| Correlation source audit | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W9-ISS-001` | `EV-W9-109` |

## Observability scenario matrix

| Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|
| Correlation coverage | `>=99%` critical events | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-201` |
| Missing critical correlation | count `0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-202` |
| Schema/version coverage | `>=99%` public events | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-203` |
| Structured log parseability | `>=99%` sample parse success | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-204` |
| Severity taxonomy | canonical severity mapping pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-205` |
| Reason/disposition taxonomy | risk/execution reason/disposition pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-206` |
| Redaction audit | leak count `0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-207` |
| Dashboard critical panels | data availability `>=95%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-208` |
| Alert false positive sample | `<=15%` if sample exists | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-209` |
| Alert false negative critical | count `0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-210` |
| W05 regression | risk limits observability preserved | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-211` |
| W06 regression | stop-loss observability preserved | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-212` |
| W07 regression | circuit breaker observability preserved | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-213` |
| W08 regression | retry/slippage observability preserved | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-214` |

## Hardening matrix

| Task | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| `W9-T07` Structured logging hardening | Python logging schema | schema parse + correlation pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-301` |
| `W9-T08` Rust metrics/health hardening | Rust metadata | component + metric labels pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-302` |
| `W9-T09` Dashboard/API schema sync | API/UI event consumption | dashboard data availability pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-303` |
| `W9-T11` Redaction hardening | sensitive fields | no leaks | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-304` |
| `W9-T12` Alert rehearsal | critical alert sample | false-negative critical `0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-305` |
| `W9-T15` Artifact reconciliation | 5 artifact gate | one final decision | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-306` |

## Governance matrix

| Task | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| `CR-W09-001` Internal observability helper change if needed | pass taxonomy/correlation context | CR recorded before implementation | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-401` |
| `W9-T14` Change budget review | files/LOC net | `<=18 files`, `<=900 LOC net` hoặc escalation record | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-402` |

## Decision (current)

- Gate status hiện tại: `PENDING_DECISION`.
- Rule cập nhật:
  - Chỉ set `GO` khi toàn bộ mục bắt buộc `CAPTURED_PASS`.
  - Nếu còn `CAPTURED_FAIL/BLOCKED_ENV` ở mục bắt buộc thì mặc định `NO-GO`.
