# Execution Retry/Slippage Baseline Report (Week 8)

## Taxonomy

- Task/Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`
- Initial Week 8 evidence status: `PENDING_EXECUTION`

## Baseline preflight

| Check | Command | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| Python integration preflight | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | critical flow runnable | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-001` |
| Observability preflight | `python -m pytest tests/integration/test_observability_integration.py -q` | observability slice runnable | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-002` |
| Rust execution preflight | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p execution-engine` | execution-engine test slice pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-003` |

## Command evidence set

| Command group | Command | Expected | Actual | Status | Mapped issue | Evidence ID |
|---|---|---|---|---|---|---|
| Python signal flow | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W8-ISS-007` | `EV-W8-101` |
| Python observability flow | `python -m pytest tests/integration/test_observability_integration.py -q` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W8-ISS-005`,`W8-ISS-009` | `EV-W8-102` |
| Rust execution suite | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p execution-engine` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W8-ISS-001`,`W8-ISS-003`,`W8-ISS-004`,`W8-ISS-006` | `EV-W8-103` |
| Rust execution/risk suites | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p execution-engine -p risk-manager` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W8-ISS-002`,`W8-ISS-007` | `EV-W8-104` |
| Rust workspace check | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W8-ISS-011` | `EV-W8-105` |
| Runtime health | `bash scripts/health_check.sh` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W8-ISS-002` | `EV-W8-106` |
| Compliance audit | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W8-ISS-005` | `EV-W8-107` |
| Correlation source audit | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W8-ISS-005` | `EV-W8-108` |

## Retry/slippage scenario matrix

| Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|
| Retry transient success | success after retry, attempts bounded | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-201` |
| Retry max attempts | stop exactly at max attempts | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-202` |
| Non-retryable risk error | no retry | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-203` |
| Non-retryable validation/config error | no retry | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-204` |
| Slippage breach error | no retry and no route | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-205` |
| Backoff bounds | delay capped by policy | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-206` |
| Duplicate order guard | duplicate order rate `<=0.1%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-207` |
| Client order id stability | same logical order keeps stable id | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-208` |
| Breaker risk-off guard | `OPEN/RESET_PENDING` blocks retry before execution | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-209` |
| Slippage valid path | valid market/limit within threshold pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-210` |
| Slippage zero/negative price | reject safely | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-211` |
| Slippage max-bps breach | reject before exchange | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-212` |
| Slippage NaN/Inf | reject safely, no panic | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-213` |
| Stop-loss close replay | no duplicate close order | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-214` |
| W05 regression | risk limits reject semantics preserved | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-215` |
| W06 regression | stop-loss coherence preserved | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-216` |
| W07 regression | circuit breaker risk-off preserved | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-217` |

## Hardening matrix

| Task | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| `W8-T07` Retry classification hardening | retryable/non-retryable matrix | classification pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-301` |
| `W8-T08` Idempotency hardening | replay same logical order | no duplicate side-effect | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-302` |
| `W8-T09` Slippage hardening | boundary and breach cases | safe reject/pass behavior | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-303` |
| `W8-T11` W07 breaker guard | risk-off before retry | no bypass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-304` |
| `W8-T12` Stress replay | repeated transient failures | no flapping/duplicate | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-305` |
| `W8-T13` Performance watermark | retry/slippage overhead | no critical regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-306` |
| `W8-T15` Artifact reconciliation | 5 artifact gate | one final decision | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-307` |

## Governance matrix

| Task | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| `CR-W08-001` Internal retry API change if needed | pass `correlation_id`/classification context | CR recorded before implementation | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-401` |
| `W8-T14` Change budget review | files/LOC net | `<=15 files`, `<=800 LOC net` hoặc escalation record | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-402` |

## Decision (current)

- Gate status hiện tại: `PENDING_DECISION`.
- Rule cập nhật:
  - Chỉ set `GO` khi toàn bộ mục bắt buộc `CAPTURED_PASS`.
  - Nếu còn `CAPTURED_FAIL/BLOCKED_ENV` ở mục bắt buộc thì mặc định `NO-GO`.
