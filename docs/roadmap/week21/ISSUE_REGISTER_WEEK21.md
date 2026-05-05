# Issue Register W21 - Final-Phase Gate 1

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: mọi P0 open hoặc P1 unowned đều chặn `GO`.

## 2) Issues

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W21-ISS-001` | P0 | `BLOCKED` | `coder` | `Pha 3 rerun` | Full lint gate | `EV-W21-201` | close remaining `black/flake8/cargo fmt/clippy` findings and rerun full lint profile | lint pass `100%` |
| `W21-ISS-002` | P0 | `BLOCKED` | `coder` | `Pha 3 rerun` | Full type/static gate | `EV-W21-202` | resolve `mypy` duplicate module path + pyright typing failures and rerun type/static profile | type/static pass `100%` |
| `W21-ISS-003` | P0 | `DONE` | `tester` | `Pha 3` | Full unit baseline gate | `EV-W21-203` | rerun full unit baseline completed | unit baseline pass `100%` |
| `W21-ISS-004` | P1 | `IN_PROGRESS` | `tester` | `Pha 4` | Test debt closure | `EV-W21-204` | close debt backlog after lint/type gates recover | debt open `=0` |
| `W21-ISS-005` | P1 | `DONE` | `planner` | `Pha 4` | Release blocker taxonomy | `EV-W21-208` | complete blocker mapping | taxonomy complete |
| `W21-ISS-006` | P1 | `DONE` | `tester` | `Pha 4` | Correlation/compliance quality | `EV-W21-205`,`EV-W21-206` | fix coverage/findings and rerun audits | coverage>=99%, findings=0 |
| `W21-ISS-007` | P1 | `DONE` | `tester` | `Pha 5` | Regression guard | `EV-W21-301..306` | rerun W09-W20 guardrail slices | regression guard pass |
| `W21-ISS-008` | P1 | `DONE` | `planner` | `Pha 6` | Final verdict consistency | `EV-W21-401`,`EV-W21-402` | strict artifact reconciliation | one final verdict |
| `W21-ISS-009` | P1 | `DONE` | `planner` | `Pha 7` | W22 handoff | `EV-W21-402` | complete NO-GO recovery queue + W22 priorities/guardrails | start pack complete |
| `W21-ISS-010` | P1 | `DONE` | `planner` | `Pha 5` | Budget governance | `EV-W21-209` | add escalation record when required | budget within threshold or approved escalation |
| `W21-ISS-011` | P2 | `DONE` | `ops` | `Pha 5` | Gate throughput | `EV-W21-210` | capture gate toil watermark | throughput watermark captured |
| `W21-ISS-012` | P2 | `DONE` | `planner` | `Pha 6` | Audit linkage | `EV-W21-205`,`EV-W21-206` | complete evidence linkage | linkage complete |

## 3) Gate blocker policy

- `W21-ISS-001..003` phải `DONE` trước gate lock.
- `P0 open = 2`, `P1 unowned = 0`.
- Không còn mandatory issue ở trạng thái `NEW/IN_PROGRESS/BLOCKED` tại gate cutoff.
