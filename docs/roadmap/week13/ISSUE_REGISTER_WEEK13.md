# Issue Register W13 - Strategy Governance

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: mọi P0 open hoặc P1 unowned đều chặn `GO`.

## 2) Issues

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W13-ISS-001` | P0 | `NEW` | `planner` | `Pha 3` | Strategy evidence gate | `EV-W13-203`,`EV-W13-214` | enforce block-by-default for missing evidence | missing-evidence strategies blocked `100%` |
| `W13-ISS-002` | P0 | `NEW` | `ops` | `Pha 3` | Decision auditability | `EV-W13-204` | standardize strategy decision trace schema | decision trace completeness `100%` |
| `W13-ISS-003` | P0 | `NEW` | `planner` | `Pha 6` | Final verdict | `EV-W13-209`,`EV-W13-210`,`EV-W13-401`,`EV-W13-402` | strict artifact reconciliation and blocker closure | one final verdict + no ownership blockers |
| `W13-ISS-004` | P1 | `NEW` | `tester` | `Pha 3` | OOS governance | `EV-W13-101`,`EV-W13-201` | reconcile OOS checklist mandatory items | OOS checklist completeness `100%` |
| `W13-ISS-005` | P1 | `NEW` | `tester` | `Pha 3` | Walk-forward governance | `EV-W13-102`,`EV-W13-202` | enforce walk-forward evidence requirements | walk-forward checklist completeness `100%` |
| `W13-ISS-006` | P1 | `NEW` | `tester` | `Pha 4` | Strategy quality guard | `EV-W13-205` | investigate and fix reproducibility drift root causes | reproducibility drift `<=1%` |
| `W13-ISS-007` | P1 | `NEW` | `ops` | `Pha 4` | Risk boundary guard | `EV-W13-106`,`EV-W13-206` | validate no new breach from governance flow | new breach count `=0` |
| `W13-ISS-008` | P1 | `NEW` | `tester` | `Pha 5` | Regression guard | `EV-W13-301..306` | rerun W09-W12 guardrail slices | regression guard pass |
| `W13-ISS-009` | P1 | `NEW` | `planner` | `Pha 7` | W14 handoff | `EV-W13-216`,`EV-W13-402` | complete W14 start pack priorities/guardrails | start pack complete |
| `W13-ISS-010` | P1 | `NEW` | `planner` | `Pha 5` | Governance stability | `EV-W13-402` | add escalation record if budget exceeded | budget ok or justified |
| `W13-ISS-011` | P2 | `NEW` | `ops` | `Pha 5` | Ops throughput | `EV-W13-213` | capture strategy review throughput/toil watermark | throughput watermark captured |
| `W13-ISS-012` | P2 | `NEW` | `planner` | `Pha 6` | Audit readiness | `EV-W13-207`,`EV-W13-208`,`EV-W13-212` | complete evidence linkage and audit closure | linkage complete + audit pass |

## 3) Gate blocker policy

- `W13-ISS-001..003` phải `DONE` để W13 có thể `GO`.
- P1 có thể không `DONE` chỉ khi không gate-blocking, có owner + ETA + mitigation + final report acceptance.
- Không được chuyển issue sang `DONE` nếu evidence còn `PENDING_EXECUTION`.
