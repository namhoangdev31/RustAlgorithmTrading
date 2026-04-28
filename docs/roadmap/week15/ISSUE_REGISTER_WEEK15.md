# Issue Register W15 - Capital Allocation

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: mọi P0 open hoặc P1 unowned đều chặn `GO`.

## 2) Issues (snapshot 2026-04-28, post-rerun)

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W15-ISS-001` | P0 | `DONE` | `ops` | `Pha 3` | Volatility/regime sizing | `EV-W15-201`,`EV-W15-202` | enforce volatility/regime sizing policy | sizing coverage `100%` |
| `W15-ISS-002` | P0 | `DONE` | `ops` | `Pha 3` | Drawdown adherence | `EV-W15-205` | enforce drawdown policy in allocation decisions | drawdown adherence `100%` |
| `W15-ISS-003` | P0 | `DONE` | `planner` | `Pha 6` | Final verdict | `EV-W15-209`,`EV-W15-210`,`EV-W15-401`,`EV-W15-402` | strict artifact reconciliation and blocker closure | one final verdict + no ownership blockers |
| `W15-ISS-004` | P1 | `DONE` | `tester` | `Pha 3` | Allocation governance | `EV-W15-101`,`EV-W15-203` | reconcile allocation checklist mandatory items | checklist completeness `100%` |
| `W15-ISS-005` | P1 | `DONE` | `planner` | `Pha 3` | Decision auditability | `EV-W15-102`,`EV-W15-204`,`EV-W15-214` | standardize allocation decision reason trace | trace completeness `100%` |
| `W15-ISS-006` | P1 | `DONE` | `ops` | `Pha 4` | Cross-strategy boundary | `EV-W15-206`,`EV-W15-207` | validate no new breach in combined scenarios | new breach count `=0` |
| `W15-ISS-007` | P1 | `DONE` | `tester` | `Pha 4` | Allocation stability | `EV-W15-208` | investigate and fix reproducibility drift | drift `<=1%` |
| `W15-ISS-008` | P1 | `DONE` | `tester` | `Pha 5` | Regression guard | `EV-W15-301..306` | rerun W09-W14 guardrail slices | regression guard pass |
| `W15-ISS-009` | P1 | `DONE` | `planner` | `Pha 7` | W16 handoff | `EV-W15-216`,`EV-W15-402` | complete W16 start pack priorities/guardrails | start pack complete |
| `W15-ISS-010` | P1 | `DONE` | `planner` | `Pha 5` | Governance stability | `EV-W15-402` | add escalation record if budget exceeded | budget ok or justified |
| `W15-ISS-011` | P2 | `DONE` | `ops` | `Pha 5` | Ops throughput | `EV-W15-213` | capture allocation review throughput/toil watermark | throughput watermark captured |
| `W15-ISS-012` | P2 | `DONE` | `planner` | `Pha 6` | Audit readiness | `EV-W15-209`,`EV-W15-210`,`EV-W15-212` | complete evidence linkage and audit closure | linkage complete + audit pass |

## 3) Gate blocker policy

- `W15-ISS-001..003` phải `DONE` để W15 có thể `GO`.
- P1 có thể không `DONE` chỉ khi không gate-blocking, có owner + ETA + mitigation + final report acceptance.
- Không được chuyển issue sang `DONE` nếu evidence còn `PENDING_EXECUTION`.

## 4) Current gate assessment

- P0 open count: `0`.
- P1 unowned count: `0`.
- Current verdict: `GO`.

## 5) Change budget control (W15 policy)

- W15 budget target: `<=20 files`, `<=1000 LOC net`.
- Observed working-set at gate lock: change set exceeded file-count target due import-hygiene hardening across allocation + observability critical paths.
- `W15-ISS-010` resolution: `DONE` with justified escalation because import/runtime hygiene fixes were required to unblock mandatory command profile and evidence capture path.
