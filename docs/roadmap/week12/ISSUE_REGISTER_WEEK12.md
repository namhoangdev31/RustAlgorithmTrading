# Issue Register W12 - Ops Readiness Gate

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: mọi P0 open hoặc P1 unowned đều chặn `GO`.

## 2) Issues

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W12-ISS-001` | P0 | `NEW` | `planner` | `Pha 3` | Readiness gate | `EV-W12-201`,`EV-W12-216` | complete readiness checklist + capture missing evidence | readiness checklist `100%` |
| `W12-ISS-002` | P0 | `NEW` | `ops` | `Pha 4` | Readiness gate | `EV-W12-202`,`EV-W12-203` | assign/close all P0/P1 ownership gaps | P0 open `=0`, P1 unowned `=0` |
| `W12-ISS-003` | P0 | `NEW` | `planner` | `Pha 6` | Final verdict | `EV-W12-401`,`EV-W12-402` | strict artifact reconciliation and single verdict lock | artifacts one verdict |
| `W12-ISS-004` | P1 | `NEW` | `ops` | `Pha 3` | Operational readiness | `EV-W12-204` | complete owner+backup+SLA+ETA matrix | escalation matrix complete |
| `W12-ISS-005` | P1 | `NEW` | `tester` | `Pha 3` | Technical readiness | `EV-W12-101`,`EV-W12-102`,`EV-W12-103`,`EV-W12-108`,`EV-W12-205` | rerun API/SLO readiness rehearsal | rehearsal pass |
| `W12-ISS-006` | P1 | `NEW` | `ops` | `Pha 3` | Operational readiness | `EV-W12-106`,`EV-W12-206`,`EV-W12-207` | run incident/recovery rehearsals and capture verify evidence | rehearsal pass |
| `W12-ISS-007` | P1 | `NEW` | `tester` | `Pha 3` | Traceability readiness | `EV-W12-109`,`EV-W12-110`,`EV-W12-208`,`EV-W12-209`,`EV-W12-210` | fix audit findings and recapture | audit findings `0` |
| `W12-ISS-008` | P1 | `NEW` | `tester` | `Pha 5` | Regression guard | `EV-W12-301..306` | rerun W09-W11 guardrail slices | regression guard pass |
| `W12-ISS-009` | P1 | `NEW` | `planner` | `Pha 7` | W13 handoff | `EV-W12-213`,`EV-W12-402` | complete W13 start pack priorities/guardrails | start pack complete |
| `W12-ISS-010` | P1 | `NEW` | `planner` | `Pha 5` | Governance stability | `EV-W12-402` | add escalation record if budget exceeded | budget ok or justified |
| `W12-ISS-011` | P2 | `NEW` | `ops` | `Pha 5` | Ops throughput | `EV-W12-214` | capture toil watermark and optimize checklist flow | toil watermark captured |
| `W12-ISS-012` | P2 | `NEW` | `planner` | `Pha 6` | Audit readiness | `EV-W12-212` | complete evidence linkage map | traceability complete |

## 3) Gate blocker policy

- `W12-ISS-001..003` phải `DONE` để W12 có thể `GO`.
- P1 có thể không `DONE` chỉ khi không gate-blocking, có owner + ETA + mitigation + final report acceptance.
- Không được chuyển issue sang `DONE` nếu evidence còn `PENDING_EXECUTION`.
