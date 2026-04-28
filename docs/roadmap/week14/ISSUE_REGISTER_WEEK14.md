# Issue Register W14 - Portfolio Controls

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: mọi P0 open hoặc P1 unowned đều chặn `GO`.

## 2) Issues (snapshot 2026-04-28, post-rerun)

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W14-ISS-001` | P0 | `DONE` | `ops` | `Pha 3` | Exposure controls | `EV-W14-201`,`EV-W14-206` | enforce exposure limits and breach blocking | exposure new breach `=0` |
| `W14-ISS-002` | P0 | `DONE` | `ops` | `Pha 3` | Concentration controls | `EV-W14-202`,`EV-W14-207` | enforce concentration limits and breach blocking | concentration new breach `=0` |
| `W14-ISS-003` | P0 | `DONE` | `planner` | `Pha 6` | Final verdict | `EV-W14-209`,`EV-W14-210`,`EV-W14-401`,`EV-W14-402` | strict artifact reconciliation and blocker closure | one final verdict + no ownership blockers |
| `W14-ISS-004` | P1 | `DONE` | `tester` | `Pha 3` | Controls governance | `EV-W14-101`,`EV-W14-203` | reconcile controls checklist mandatory items | checklist completeness `100%` |
| `W14-ISS-005` | P1 | `DONE` | `planner` | `Pha 3` | Decision auditability | `EV-W14-104`,`EV-W14-204`,`EV-W14-214` | standardize decision and breach reason trace | trace completeness `100%` |
| `W14-ISS-006` | P1 | `DONE` | `ops` | `Pha 4` | Cross-strategy risk boundary | `EV-W14-205`,`EV-W14-206`,`EV-W14-207` | validate no new breach in combined scenarios | new breach count `=0` |
| `W14-ISS-007` | P1 | `DONE` | `tester` | `Pha 4` | Strategy/portfolio quality | `EV-W14-208` | investigate and fix reproducibility drift | drift `<=1%` |
| `W14-ISS-008` | P1 | `DONE` | `tester` | `Pha 5` | Regression guard | `EV-W14-301..306` | rerun W09-W13 guardrail slices | regression guard pass |
| `W14-ISS-009` | P1 | `DONE` | `planner` | `Pha 7` | W15 handoff | `EV-W14-216`,`EV-W14-402` | complete W15 start pack priorities/guardrails | start pack complete |
| `W14-ISS-010` | P1 | `DONE` | `planner` | `Pha 5` | Governance stability | `EV-W14-402` | add escalation record if budget exceeded | budget ok or justified |
| `W14-ISS-011` | P2 | `DONE` | `ops` | `Pha 5` | Ops throughput | `EV-W14-213` | capture portfolio review throughput/toil watermark | throughput watermark captured |
| `W14-ISS-012` | P2 | `DONE` | `planner` | `Pha 6` | Audit readiness | `EV-W14-209`,`EV-W14-210`,`EV-W14-212` | complete evidence linkage and audit closure | linkage complete + audit pass |

## 3) Gate blocker policy

- `W14-ISS-001..003` phải `DONE` để W14 có thể `GO`.
- P1 có thể không `DONE` chỉ khi không gate-blocking, có owner + ETA + mitigation + final report acceptance.
- Không được chuyển issue sang `DONE` nếu evidence còn `PENDING_EXECUTION`.

## 4) Current gate assessment

- P0 open count: `0`.
- P1 unowned count: `0`.
- Current verdict: `GO`.

## 5) Change budget control (W14 policy)

- W14 budget target: `<=20 files`, `<=1000 LOC net`.
- Observed working-set at gate lock: `22` tracked files changed + `4` new files, net LOC `+53`.
- `W14-ISS-010` resolution: `DONE` with justified escalation because import-hygiene fixes were required to unblock mandatory command profile and evidence capture path.
