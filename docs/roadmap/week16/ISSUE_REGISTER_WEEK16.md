# Issue Register W16 - Research Reproducibility

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: mọi P0 open hoặc P1 unowned đều chặn `GO`.

## 2) Issues

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W16-ISS-001` | P0 | `NEW` | `tester` | `Pha 3` | Seed compliance | `EV-W16-201` | enforce seed profile for all required reruns | seed-control compliance `100%` |
| `W16-ISS-002` | P0 | `NEW` | `tester` | `Pha 3` | Deterministic rerun | `EV-W16-202`,`EV-W16-206` | enforce deterministic rerun profile + drift threshold | deterministic coverage `100%` + drift `<=1%` |
| `W16-ISS-003` | P0 | `NEW` | `planner` | `Pha 6` | Final verdict | `EV-W16-209`,`EV-W16-210`,`EV-W16-401`,`EV-W16-402` | strict artifact reconciliation and blocker closure | one final verdict + no ownership blockers |
| `W16-ISS-004` | P1 | `NEW` | `planner` | `Pha 3` | Repro governance | `EV-W16-101`,`EV-W16-203` | reconcile reproducibility checklist mandatory items | checklist completeness `100%` |
| `W16-ISS-005` | P1 | `NEW` | `planner` | `Pha 3` | Decision auditability | `EV-W16-102`,`EV-W16-204`,`EV-W16-214` | standardize reproducibility decision reason trace | trace completeness `100%` |
| `W16-ISS-006` | P1 | `NEW` | `tester` | `Pha 4` | Multi-rerun consistency | `EV-W16-205`,`EV-W16-206` | validate consistency across required reruns | consistency pass + drift `<=1%` |
| `W16-ISS-007` | P1 | `NEW` | `ops` | `Pha 4` | Exception handling consistency | `EV-W16-207`,`EV-W16-208` | normalize exception handling and prevent breach | consistency `100%` + new breach count `=0` |
| `W16-ISS-008` | P1 | `NEW` | `tester` | `Pha 5` | Regression guard | `EV-W16-301..306` | rerun W09-W15 guardrail slices | regression guard pass |
| `W16-ISS-009` | P1 | `NEW` | `planner` | `Pha 7` | W17 handoff | `EV-W16-216`,`EV-W16-402` | complete W17 start pack priorities/guardrails | start pack complete |
| `W16-ISS-010` | P1 | `NEW` | `planner` | `Pha 5` | Governance stability | `EV-W16-402` | add escalation record if budget exceeded | budget ok or justified |
| `W16-ISS-011` | P2 | `NEW` | `ops` | `Pha 5` | Ops throughput | `EV-W16-213` | capture rerun throughput/toil watermark | throughput watermark captured |
| `W16-ISS-012` | P2 | `NEW` | `planner` | `Pha 6` | Audit readiness | `EV-W16-209`,`EV-W16-210`,`EV-W16-212` | complete evidence linkage and audit closure | linkage complete + audit pass |

## 3) Gate blocker policy

- `W16-ISS-001..003` phải `DONE` để W16 có thể `GO`.
- P1 có thể không `DONE` chỉ khi không gate-blocking, có owner + ETA + mitigation + final report acceptance.
- Không được chuyển issue sang `DONE` nếu evidence còn `PENDING_EXECUTION`.
