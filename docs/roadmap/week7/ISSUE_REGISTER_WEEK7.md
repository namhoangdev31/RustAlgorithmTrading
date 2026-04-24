# Issue Register Week 7 (Circuit Breaker Hardening)

## Board schema

- Flow: `NEW -> IN_PROGRESS -> BLOCKED -> DONE`
- Metadata bắt buộc: `issue_id`, `cluster`, `severity`, `owner`, `due`, `eta`, `status`, `dependency`, `mitigation`, `exit_criteria`, `evidence_id`, `blocking_of`
- Cluster chuẩn: `A-Incompatibility`, `B-SemanticDrift`, `C-ObservabilityGap`

## Closed issues

| Issue ID | Cluster | Severity | Owner | Due | ETA | Status | Dependency | Mitigation | Exit criteria | Evidence ID | Blocking of |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `W7-ISS-001` | A-Incompatibility | P0 | `coder` | Pha 3 | Pha 3 | `DONE` | state machine freeze | implemented `CLOSED/OPEN/RESET_PENDING/HALF_OPEN/DISABLED` | transition matrix 100% | `EV-W7-201..209`,`EV-W7-301` | Gate |
| `W7-ISS-002` | A-Incompatibility | P0 | `coder` | Pha 3 | Pha 3 | `DONE` | execution guard | breaker check runs before limit/execution validation | reject before execution pass | `EV-W7-203`,`EV-W7-303` | Gate |
| `W7-ISS-003` | A-Incompatibility | P0 | `tester` | Pha 4 | Pha 4 | `DONE` | stress scenario | repeated trip/recover integration test | loop-trip count = 0 | `EV-W7-212`,`EV-W7-302` | Gate |
| `W7-ISS-004` | B-SemanticDrift | P1 | `coder` | Pha 4 | Pha 4 | `DONE` | cooldown policy | reset denied before cooldown; cooldown moves to reset pending | false reset = 0 | `EV-W7-205`,`EV-W7-206` | Gate |
| `W7-ISS-005` | C-ObservabilityGap | P1 | `ops` | Pha 4 | Pha 4 | `DONE` | observability profile | structured `correlation_id` audit and event metadata checks | correlation audit 0 findings + metadata complete | `EV-W7-106`,`EV-W7-107`,`EV-W7-213` | Gate |
| `W7-ISS-006` | C-ObservabilityGap | P1 | `ops` | Pha 5 | Pha 5 | `DONE` | runbook reset | reset requires cooldown then approval then probe | reset drill pass | `EV-W7-206..208`,`EV-W7-215`,`EV-W7-304` | Gate |
| `W7-ISS-007` | B-SemanticDrift | P1 | `tester` | Pha 5 | Pha 5 | `DONE` | W05/W06 guardrails | reran regression slices after W07 | no W05/W06 regression | `EV-W7-101`,`EV-W7-103`,`EV-W7-211` | Gate |
| `W7-ISS-008` | C-ObservabilityGap | P1 | `planner` | Pha 6 | Pha 6 | `DONE` | doc sync | synced baseline/issue/gate/KPI/final | one final decision | `EV-W7-305` | Gate |
| `W7-ISS-009` | C-ObservabilityGap | P1 | `ops` | Pha 4 | Pha 4 | `DONE` | metrics registry | added Prometheus text assertion for breaker metrics | metric audit pass | `EV-W7-108`,`EV-W7-214` | Gate |
| `W7-ISS-010` | B-SemanticDrift | P1 | `coder` | Pha 4 | Pha 4 | `DONE` | W05 hot-reload | hot reload cannot disable/close active `OPEN` state | reload interaction guard pass | `EV-W7-211` | Gate |
| `W7-ISS-011` | B-SemanticDrift | P2 | `planner` | Pha 5 | Pha 5 | `DONE` | scope creep | kept edits scoped to circuit breaker, risk manager, metrics, tests and docs | within budget or justified | `EV-W7-402` | Governance |
| `W7-ISS-012` | B-SemanticDrift | P2 | `ops` | Pha 5 | Pha 5 | `DONE` | perf watermark | targeted suites show no runtime blocker; performance-specific tuning deferred unless W08 retry exposes overhead | no performance gate blocker | `EV-W7-306` | KPI |

## Change records

| CR ID | Change | Scope | Compatibility | Rollback | Owner | Evidence |
|---|---|---|---|---|---|---|
| `CR-W07-001` | Internal `RiskManagerService::validate_order` uses `&mut self` | internal Rust API only | public wire envelope unchanged | revert service signature + state transition calls if W07 gate fails | `coder` | `EV-W7-103`,`EV-W7-201..215`,`EV-W7-401` |

## Gate blockers

- [x] Không còn P0 open.
- [x] Không còn evidence `CAPTURED_FAIL/BLOCKED_ENV` trong matrix bắt buộc.
- [x] Không còn P1 unowned.
- [x] Gate artifacts thống nhất một trạng thái cuối: `GO`.
