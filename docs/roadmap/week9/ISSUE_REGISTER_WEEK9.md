# Issue Register Week 9 (Observability Contract)

## Board schema

- Flow: `NEW -> IN_PROGRESS -> BLOCKED -> DONE`
- Metadata bắt buộc: `issue_id`, `cluster`, `severity`, `owner`, `due`, `eta`, `status`, `dependency`, `mitigation`, `exit_criteria`, `evidence_id`, `blocking_of`
- Cluster chuẩn: `A-Incompatibility`, `B-SemanticDrift`, `C-ObservabilityGap`

## Active issues

| Issue ID | Cluster | Severity | Owner | Due | ETA | Status | Dependency | Mitigation | Exit criteria | Evidence ID | Blocking of |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `W9-ISS-001` | C-ObservabilityGap | P0 | `ops` | Pha 3 | Pha 3 | `DONE` | critical event list | audit + patch correlation propagation | missing critical correlation count `=0` | `EV-W9-201`,`EV-W9-202` | Gate |
| `W9-ISS-002` | A-Incompatibility | P0 | `coder` | Pha 3 | Pha 3 | `DONE` | logging schema freeze | parseability fixture + formatter hardening | structured log parse success `>=99%` | `EV-W9-204`,`EV-W9-301` | Gate |
| `W9-ISS-003` | C-ObservabilityGap | P0 | `ops` | Pha 4 | Pha 4 | `DONE` | redaction audit | patch redaction handler before other obs polish | redaction leak count `=0` | `EV-W9-207`,`EV-W9-304` | Gate |
| `W9-ISS-004` | B-SemanticDrift | P1 | `planner` | Pha 3 | Pha 3 | `DONE` | taxonomy freeze | normalize severity/reason/disposition mapping | taxonomy matrix pass | `EV-W9-205`,`EV-W9-206` | Gate |
| `W9-ISS-005` | C-ObservabilityGap | P1 | `ops` | Pha 4 | Pha 4 | `DONE` | dashboard/API sample | verify panel data availability | dashboard availability `>=95%` | `EV-W9-208`,`EV-W9-303` | Gate |
| `W9-ISS-006` | C-ObservabilityGap | P1 | `ops` | Pha 4 | Pha 4 | `DONE` | alert sample | add/rehearse critical alert sample | critical false-negative `=0` | `EV-W9-209`,`EV-W9-210` | Gate |
| `W9-ISS-007` | B-SemanticDrift | P1 | `tester` | Pha 5 | Pha 5 | `DONE` | W05-W08 guardrails | rerun regression slices after W09 | no W05-W08 regression | `EV-W9-211..214` | Gate |
| `W9-ISS-008` | C-ObservabilityGap | P1 | `planner` | Pha 6 | Pha 6 | `DONE` | doc sync | sync baseline/issue/gate/KPI/final | one final decision | `EV-W9-306`,`EV-W9-402` | Gate |
| `W9-ISS-009` | A-Incompatibility | P1 | `coder` | Pha 3 | Pha 3 | `DONE` | API/dashboard schema | add adapter or fixture if needed | API/dashboard schema checks pass | `EV-W9-101`,`EV-W9-208`,`EV-W9-303` | Gate |
| `W9-ISS-010` | C-ObservabilityGap | P1 | `coder` | Pha 3 | Pha 3 | `DONE` | Rust metrics/health | add component metadata or tests if needed | Rust metadata matrix pass | `EV-W9-104`,`EV-W9-302` | Gate |
| `W9-ISS-011` | B-SemanticDrift | P2 | `planner` | Pha 5 | Pha 5 | `DONE` | scope creep | enforce change-budget tracking | within budget or escalation record | `EV-W9-402` | Governance |
| `W9-ISS-012` | B-SemanticDrift | P2 | `ops` | Pha 5 | Pha 5 | `DONE` | perf watermark | measure/record observability overhead if harness available | no critical overhead blocker | `EV-W9-304` | KPI |

## Change records

| CR ID | Trigger | Status | Required before |
|---|---|---|---|
| `CR-W09-001` | Internal observability helper/API schema change needed for correlation/taxonomy context | `PENDING_IF_NEEDED` | any internal API/helper change in observability/logging/metrics path |

## Gate blockers

- [ ] Không còn P0 open.
- [ ] Không còn evidence `CAPTURED_FAIL/BLOCKED_ENV` trong matrix bắt buộc.
- [ ] Không còn P1 unowned.
- [ ] Gate artifacts thống nhất một trạng thái cuối.
