# Issue Register Week 8 (Execution Retry/Slippage)

## Board schema

- Flow: `NEW -> IN_PROGRESS -> BLOCKED -> DONE`
- Metadata bắt buộc: `issue_id`, `cluster`, `severity`, `owner`, `due`, `eta`, `status`, `dependency`, `mitigation`, `exit_criteria`, `evidence_id`, `blocking_of`
- Cluster chuẩn: `A-Incompatibility`, `B-SemanticDrift`, `C-ObservabilityGap`

## Active issues

| Issue ID | Cluster | Severity | Owner | Due | ETA | Status | Dependency | Mitigation | Exit criteria | Evidence ID | Blocking of |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `W8-ISS-001` | A-Incompatibility | P0 | `coder` | Pha 3 | Pha 3 | `DONE` | retry baseline | implement/lock idempotent retry | duplicate order rate `<=0.1%` | `EV-W8-207`,`EV-W8-301` | Gate |
| `W8-ISS-002` | A-Incompatibility | P0 | `coder` | Pha 4 | Pha 4 | `DONE` | W07 breaker state | ensure retry checks risk-off before execution | risk-off bypass count `=0` | `EV-W8-209`,`EV-W8-304` | Gate |
| `W8-ISS-003` | A-Incompatibility | P0 | `coder` | Pha 3 | Pha 3 | `DONE` | slippage baseline | reject breach before exchange | slippage breach route count `=0` | `EV-W8-212`,`EV-W8-303` | Gate |
| `W8-ISS-004` | B-SemanticDrift | P1 | `coder` | Pha 3 | Pha 3 | `DONE` | classification freeze | split retryable/non-retryable | classification matrix pass | `EV-W8-201..206` | Gate |
| `W8-ISS-005` | C-ObservabilityGap | P1 | `ops` | Pha 4 | Pha 4 | `DONE` | observability profile | verify structured context | correlation audit 0 findings + metadata complete | `EV-W8-107`,`EV-W8-108`,`EV-W8-304` | Gate |
| `W8-ISS-006` | B-SemanticDrift | P1 | `tester` | Pha 3 | Pha 3 | `DONE` | slippage boundary tests | add/lock NaN/Inf/zero/negative coverage | invalid price acceptance `=0` | `EV-W8-211`,`EV-W8-213` | Gate |
| `W8-ISS-007` | B-SemanticDrift | P1 | `tester` | Pha 5 | Pha 5 | `DONE` | W05/W06/W07 guardrails | rerun regression slices after W08 | no W05/W06/W07 regression | `EV-W8-215..217` | Gate |
| `W8-ISS-008` | C-ObservabilityGap | P1 | `planner` | Pha 6 | Pha 6 | `DONE` | doc sync | sync baseline/issue/gate/KPI/final | one final decision | `EV-W8-307`,`EV-W8-402` | Gate |
| `W8-ISS-009` | C-ObservabilityGap | P1 | `ops` | Pha 4 | Pha 4 | `DONE` | metrics registry | verify retry/slippage metrics or record no-new-metric rationale | metric audit pass | `EV-W8-305` | Gate |
| `W8-ISS-010` | B-SemanticDrift | P1 | `coder` | Pha 5 | Pha 5 | `DONE` | warning baseline | triage execution slippage warnings | warning is fixed or recorded non-blocking | `EV-W8-105` | Gate |
| `W8-ISS-011` | B-SemanticDrift | P2 | `planner` | Pha 5 | Pha 5 | `DONE` | scope creep | enforce change-budget tracking | within budget or escalation record | `EV-W8-402` | Governance |
| `W8-ISS-012` | B-SemanticDrift | P2 | `ops` | Pha 5 | Pha 5 | `DONE` | perf watermark | measure/record retry/slippage overhead if harness available | no critical overhead blocker | `EV-W8-306` | KPI |

## Change records

| CR ID | Trigger | Status | Required before |
|---|---|---|---|
| `CR-W08-001` | Internal retry API needs `correlation_id`, classification context or idempotency context | `DONE` | any internal API change in `retry.rs`/`router.rs` |

## Gate blockers

- [x] Không còn P0 open.
- [x] Không còn evidence `CAPTURED_FAIL/BLOCKED_ENV` trong matrix bắt buộc.
- [x] Không còn P1 unowned.
- [x] Gate artifacts thống nhất một trạng thái cuối.
