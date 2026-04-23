# Issue Register Week 3 (One-pass)

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
| `W3-ISS-001` | A-Incompatibility | P0 | coder | Pha 2 | 1 phase | `NEW` | contract parser freeze | enforce parser behavior + structured reject | parser matrix pass | `EV-W3-201..207` | Gate |
| `W3-ISS-002` | B-SemanticDrift | P0 | coder | Pha 3 | 1 phase | `NEW` | bridge mapping | normalize Signal fields + timestamp | Python->Rust handoff pass | `EV-W3-208` | Gate |
| `W3-ISS-003` | B-SemanticDrift | P0 | coder | Pha 3 | 1 phase | `NEW` | models/types mapping | complete RiskDecision + ExecutionAck | Rust->Python handoff pass | `EV-W3-209` | Gate |
| `W3-ISS-004` | B-SemanticDrift | P1 | reviewer | Pha 3 | 1 phase | `NEW` | execution telemetry | verify telemetry completeness | execution contract tests pass | `EV-W3-209` | KPI |
| `W3-ISS-005` | C-ObservabilityGap | P1 | ops | Pha 3 | 1 phase | `NEW` | observability cutover | unify `correlation_id` logging contract | observability tests pass | `EV-W3-210` | KPI |
| `W3-ISS-006` | A-Incompatibility | P1 | tester | Pha 2 | 1 phase | `NEW` | negative coverage | expand negative test set | all negative tests pass | `EV-W3-202..207` | Gate |
| `W3-ISS-007` | C-ObservabilityGap | P2 | planner | Pha 7 | 1 phase | `NEW` | docs hygiene | align all artifacts | no contradiction in final docs | `EV-W3-901` | Week4 handoff |
| `W3-ISS-008` | B-SemanticDrift | P2 | tester | Pha 7 | 1 phase | `NEW` | edge-case backlog | prepare week4 expansion set | week4 checklist ready | `EV-W3-902` | Week4 handoff |
| `W3-ISS-009` | B-SemanticDrift | P1 | tester + planner | Pha 5 | 1 phase | `NEW` | policy drift | sync policy with workspace dependencies | policy check done | `EV-W3-104` | Gate |
| `W3-ISS-010` | A-Incompatibility | P1 | tester | Pha 7 | 1 phase | `NEW` | fuzzing stability | add fuzz harness + no-panic assertion | `W3-T19` pass | `EV-W3-211` | Gate |
| `W3-ISS-011` | C-ObservabilityGap | P1 | ops + tester | Pha 7 | 1 phase | `NEW` | trace continuity | shadow audit 5 correlation paths + compliance script pass | `W3-T20` pass | `EV-W3-212`,`EV-W3-106` | Gate |
| `W3-ISS-012` | C-ObservabilityGap | P1 | ops | Pha 7 | 1 phase | `NEW` | source audit | run `audit_correlation.py` và xử lý toàn bộ findings | `0 findings` | `EV-W3-107` | Gate |
| `W3-ISS-013` | C-ObservabilityGap | P1 | planner + reviewer | Pha 7 | 1 phase | `NEW` | playbook sync | update class/type + contract behavior map | `W3-T21` pass | `EV-W3-213` | Gate |
| `W3-ISS-014` | A-Incompatibility | P1 | tester + ops | Pha 7 | 1 phase | `NEW` | network resilience | run disconnect simulation + verify auto-recover | `W3-T22` pass | `EV-W3-214` | Gate |
| `W3-ISS-015` | B-SemanticDrift | P2 | tester | Pha 7 | 1 phase | `NEW` | perf watermark | capture E2E Signal->Ack watermark | `W3-T23` pass | `EV-W3-218..220` | KPI |

## Gate blockers
- Không được set `GO` khi còn P0 chưa `DONE`.
- Không được set `GO` khi `W3-ISS-009`,`W3-ISS-010`,`W3-ISS-011`,`W3-ISS-012`,`W3-ISS-013`,`W3-ISS-014` chưa `DONE`.

---
Last updated: W03 no-date mode sync
