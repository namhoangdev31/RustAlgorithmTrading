# Issue Register Week 10 (API Health & SLO)

## Board schema

- Flow: `NEW -> IN_PROGRESS -> BLOCKED -> DONE`
- Metadata bắt buộc: `issue_id`, `cluster`, `severity`, `owner`, `due`, `eta`, `status`, `dependency`, `mitigation`, `exit_criteria`, `evidence_id`, `blocking_of`
- Cluster chuẩn: `A-Incompatibility`, `B-SemanticDrift`, `C-ObservabilityGap`

## Active issues

| Issue ID | Cluster | Severity | Owner | Due | ETA | Status | Dependency | Mitigation | Exit criteria | Evidence ID | Blocking of |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `W10-ISS-001` | C-ObservabilityGap | P0 | `ops` | Pha 4 | Pha 4 | `DONE` | alert profile | bổ sung incident replay sample cho critical alerts | critical false-negative `=0` với sample thật | `EV-W10-209`,`EV-W10-304` | Gate |
| `W10-ISS-002` | A-Incompatibility | P0 | `coder` | Pha 3 | Pha 3 | `DONE` | health endpoints | lock ready/live correctness tests | ready/live correctness `100%` | `EV-W10-202`,`EV-W10-203` | Gate |
| `W10-ISS-003` | C-ObservabilityGap | P0 | `tester` | Pha 2 | Pha 2 | `DONE` | baseline capture | collect latency matrix | health/SLO latency captured | `EV-W10-201`,`EV-W10-204` | Gate |
| `W10-ISS-004` | C-ObservabilityGap | P1 | `ops` | Pha 4 | Pha 4 | `DONE` | alert sample | chuẩn hóa sample method + threshold tuning | false-positive sample `<=15%` | `EV-W10-208` | Gate |
| `W10-ISS-005` | C-ObservabilityGap | P1 | `ops` | Pha 4 | Pha 4 | `DONE` | W09 taxonomy | thêm event->alert timing capture harness | latency `<=120s` hoặc mitigation rõ | `EV-W10-207` | Gate |
| `W10-ISS-006` | C-ObservabilityGap | P1 | `ops` | Pha 4 | Pha 4 | `DONE` | dashboard SLO panels | thêm dashboard runtime probe + source checks | panel availability `>=95%` | `EV-W10-211`,`EV-W10-305` | Gate |
| `W10-ISS-007` | B-SemanticDrift | P1 | `tester` | Pha 5 | Pha 5 | `DONE` | W05-W09 guardrails | rerun regression slices after W10 | no W05-W09 regression | `EV-W10-213..217` | Gate |
| `W10-ISS-008` | C-ObservabilityGap | P1 | `planner` | Pha 6 | Pha 6 | `DONE` | doc sync | sync baseline/issue/gate/KPI/final | one final decision | `EV-W10-306`,`EV-W10-402` | Gate |
| `W10-ISS-009` | A-Incompatibility | P1 | `coder` | Pha 3 | Pha 3 | `DONE` | system route schema | adapter/fixture if schema drift | API schema checks pass | `EV-W10-204`,`EV-W10-205` | Gate |
| `W10-ISS-010` | C-ObservabilityGap | P1 | `coder` | Pha 3 | Pha 3 | `DONE` | websocket manager | harden stale-stream/restart handling | heartbeat success `>=99%` | `EV-W10-206`,`EV-W10-303` | Gate |
| `W10-ISS-011` | B-SemanticDrift | P2 | `planner` | Pha 5 | Pha 5 | `DONE` | scope creep | enforce change-budget tracking | within budget or escalation record | `EV-W10-402` | Governance |
| `W10-ISS-012` | B-SemanticDrift | P2 | `ops` | Pha 5 | Pha 5 | `DONE` | perf watermark | tách profile perf cho môi trường dev/ci | no critical overhead blocker | `EV-W10-102`,`EV-W10-304` | KPI |

## Change records

| CR ID | Trigger | Status | Required before |
|---|---|---|---|
| `CR-W10-001` | API response or alert schema change needed for SLO/alert correctness | `NOT_REQUIRED` | any public response shape or alert schema change |

## Gate blockers

- [x] Không còn P1 unowned.
- [x] Gate artifacts thống nhất một trạng thái cuối.
- [x] Không còn P0 open.
- [x] Không còn evidence `CAPTURED_FAIL/BLOCKED_ENV` trong matrix bắt buộc.
