# Issue Register Week 5 (Risk Limits v1)

## Board schema

- Flow: `NEW -> IN_PROGRESS -> BLOCKED -> DONE`
- Metadata bắt buộc: `issue_id`, `cluster`, `severity`, `owner`, `due`, `eta`, `status`, `dependency`, `mitigation`, `exit_criteria`, `evidence_id`, `blocking_of`
- Cluster chuẩn:
  - `A-Incompatibility`
  - `B-SemanticDrift`
  - `C-ObservabilityGap`

## Active issues

| Issue ID | Cluster | Severity | Owner | Due | ETA | Status | Dependency | Mitigation | Exit criteria | Evidence ID | Blocking of |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `W5-ISS-001` | A-Incompatibility | P0 | `coder` | Pha 3 | Pha 3 completed | `DONE` | symbol caps policy | implement position/value/volume caps | symbol checks pass | `EV-W5-201`,`EV-W5-207` | Gate |
| `W5-ISS-002` | A-Incompatibility | P0 | `coder` | Pha 3 | Pha 3 completed | `DONE` | strategy caps policy | implement strategy allocation guards | strategy checks pass | `EV-W5-202`,`EV-W5-208` | Gate |
| `W5-ISS-003` | B-SemanticDrift | P1 | `coder` | Pha 3 | Pha 3 completed | `DONE` | reject mapping | align reason_code + limit_snapshot | reject payload complete | `EV-W5-203`,`EV-W5-301` | Gate |
| `W5-ISS-004` | B-SemanticDrift | P1 | `coder` | Pha 3 | Pha 4 completed | `DONE` | bridge integration | risk-reject ack/disposition sync | reject mapping pass | `EV-W5-301`,`EV-W5-210` | Gate |
| `W5-ISS-005` | A-Incompatibility | P0 | `tester` | Pha 4 | Pha 4 completed | `DONE` | execution feedback | harden duplicate order guardrail | duplicate reject path blocked | `EV-W5-205`,`EV-W5-302` | Gate |
| `W5-ISS-006` | A-Incompatibility | P0 | `ops` | Pha 5 | Pha 5 completed | `DONE` | patch rollout | monitor post-rollout risk health | risk breaches = 0 in baseline rerun | `EV-W5-103`,`EV-W5-105` | Gate |
| `W5-ISS-007` | C-ObservabilityGap | P1 | `tester` | Pha 4 | Pha 4 completed | `DONE` | audit profile | fix correlation gaps on reject path | zero findings | `EV-W5-106`,`EV-W5-107` | Gate |
| `W5-ISS-008` | C-ObservabilityGap | P1 | `planner` | Pha 6 | Pha 6 completed | `DONE` | doc sync | sync baseline/issue/gate/final | one decision GO | `EV-W5-206`,`EV-W5-304` | Gate |
| `W5-ISS-009` | B-SemanticDrift | P2 | `planner` | Pha 5 | Pha 5 completed | `DONE` | scope creep | enforce change-budget tracking | within budget | `EV-W5-401` | Governance |
| `W5-ISS-010` | B-SemanticDrift | P1 | `coder` | Pha 3 | Pha 3 completed | `DONE` | enum contract | canonicalize Decision/ReasonCode | compile + serialization pass | `EV-W5-209` | Gate |
| `W5-ISS-011` | A-Incompatibility | P1 | `coder` | Pha 4 | Pha 4 completed | `DONE` | bridge cutover | fail-fast for REJECT disposition | reject blocked ratio 100% in tests | `EV-W5-210`,`EV-W5-302` | Gate |
| `W5-ISS-012` | C-ObservabilityGap | P1 | `ops` | Pha 4 | Pha 4 completed | `DONE` | privacy policy | mask limit_snapshot on public logs | 100% compliance | `EV-W5-211`,`EV-W5-305` | Gate |
| `W5-ISS-013` | B-SemanticDrift | P2 | `ops` | Pha 5 | Pha 5 completed | `DONE` | perf watermark | benchmark risk lookup overhead | overhead <= 0.2ms | `EV-W5-108`,`EV-W5-109`,`EV-W5-212` | KPI |
| `W5-ISS-014` | B-SemanticDrift | P2 | `tester` | Pha 3 | Pha 3 completed | `DONE` | edge cases | BVA coverage (limit-1/limit/limit+1) | 100% coverage | `EV-W5-207`,`EV-W5-208` | Gate |

## Gate blockers

- [x] Không còn P0 open.
- [x] Không còn evidence `CAPTURED_FAIL/BLOCKED_ENV` trong matrix bắt buộc.
- [x] Không còn P1 unowned.
- [x] Gate artifacts thống nhất một trạng thái cuối.

---
Last updated: 2026-04-23 (W5 closeout sync)
