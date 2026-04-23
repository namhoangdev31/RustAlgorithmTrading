# Issue Register v2 - Week 2

## Board schema

- Columns: `New -> Triage -> In Progress -> Blocked -> Done`
- Required metadata: `issue_id`, `severity`, `owner`, `due`, `exit_criteria`, `dependency`, `mitigation`

## Active issues

| Issue ID | Severity | Owner | Due | Status | Dependency | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|
| `W2-ISS-001` | P0 | planner | 2026-04-28 | New | contract inventory | freeze boundary list v1 | mọi boundary critical có owner file + test path |
| `W2-ISS-002` | P0 | tester | 2026-04-29 | New | PyO3/Python policy | define one approved command policy for local/dev/CI | rerun `cargo check/test` theo policy không mâu thuẫn |
| `W2-ISS-003` | P0 | coder | 2026-04-30 | New | schema envelope audit | chốt spec delta + mismatch mapping | envelope `schema_version` có acceptance rõ cho tuần 3 |
| `W2-ISS-004` | P1 | coder | 2026-05-01 | New | risk semantics drift | classify mismatch by scenario | `RiskDecision` mismatch có owner + ETA implementation |
| `W2-ISS-005` | P1 | reviewer | 2026-05-01 | New | execution ack telemetry | enforce required ack fields in spec delta | `ExecutionAck` field set được khóa ở audit output |
| `W2-ISS-006` | P1 | ops | 2026-05-02 | New | observability mapping drift | define event severity/component map | `ObservabilityEvent` mapping có baseline evidence |
| `W2-ISS-007` | P2 | planner | 2026-05-03 | New | canonical/doc drift | create week3 hygiene backlog | docs mismatch có replacement mapping |
| `W2-ISS-008` | P2 | tester | 2026-05-03 | New | negative contract cases thiếu | draft test skeleton expansion | week3 contract tests có todo list theo priority |

## Triage clusters (Week 2)

- Schema/Versioning:
  - `W2-ISS-003`
- Semantics:
  - `W2-ISS-004`, `W2-ISS-005`
- Compatibility/runtime:
  - `W2-ISS-002`
- Observability envelope:
  - `W2-ISS-006`
- Docs/canonical:
  - `W2-ISS-007`
- Testing completeness:
  - `W2-ISS-008`

## Severity policy

- P0: chặn gate tuần 2 hoặc chặn kickoff tuần 3.
- P1: rủi ro cao, có workaround ngắn hạn.
- P2: hygiene/completeness, theo dõi sang tuần 3.

---
Last updated: 2026-04-23
