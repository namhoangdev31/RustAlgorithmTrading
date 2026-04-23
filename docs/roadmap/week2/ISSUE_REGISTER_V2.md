# Issue Register v2 - Week 2 (No-Date Mode)

## Board schema
- Columns: `New -> Triage -> In Progress -> Blocked -> Done`
- Required metadata: `issue_id`, `severity`, `owner`, `eta`, `exit_criteria`, `dependency`, `mitigation`

## Active issues

| Issue ID | Severity | Owner | ETA | Status | Dependency | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|
| `W2-ISS-001` | P0 | planner | `W02-D2` | Done | contract inventory | freeze boundary list v1 | all boundary paths and owners verified |
| `W2-ISS-002` | P0 | tester | `W02-D3` | Done | runtime compat policy | establish ABI3 policy v1 | `COMPATIBILITY_POLICY_V1.md` approved |
| `W2-ISS-003` | P0 | coder | `W02-D4` | Done | schema envelope audit | define ISO timestamp standard | `INTERFACE_SPEC_DELTA_V1.md` approved |
| `W2-ISS-004` | P1 | coder | `W02-D5` | Done | risk semantics drift | map approved/reason to decision/reason_code | mitigation ready for W03 |
| `W2-ISS-005` | P1 | reviewer | `W02-D5` | Done | execution ack telemetry | map fields to canonical ack | mitigation ready for W03 |
| `W2-ISS-006` | P1 | ops | `W02-D6` | Done | observability mapping | keep canonical `correlation_id` | mitigation ready for W03 |
| `W2-ISS-007` | P2 | planner | `W02-D7` | New | canonical/doc drift | create W03 hygiene backlog | replacement mapping defined |
| `W2-ISS-008` | P2 | tester | `W02-D7` | New | negative contract gaps | draft test skeleton expansion | W03 todo list prioritized |

## Triage clusters (W02)
- Schema/Versioning: `W2-ISS-003`
- Semantics: `W2-ISS-004`, `W2-ISS-005`
- Compatibility/runtime: `W2-ISS-002`
- Observability envelope: `W2-ISS-006`
- Docs/canonical: `W2-ISS-007`
- Testing completeness: `W2-ISS-008`

## Severity policy
- P0: chặn gate W02 hoặc kickoff W03.
- P1: rủi ro cao, có workaround ngắn hạn.
- P2: hygiene/completeness, theo dõi sang W03.

---
Last updated: W02 no-date mode sync
