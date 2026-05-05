# Issue Register W22 - Final-Phase Gate 2

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: mọi P0 open hoặc P1 unowned đều chặn `GO`.

## 2) Issues

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W22-ISS-001` | P0 | `DONE` | `tester` | `Pha 3` | Full Python unit+integration gate | `EV-W22-201` | close python unit/integration failures + rerun | Python suites pass `100%` |
| `W22-ISS-002` | P0 | `DONE` | `tester` | `Pha 3` | Full Rust unit+integration gate | `EV-W22-202` | rust suites pass and evidence captured | Rust suites pass `100%` |
| `W22-ISS-003` | P0 | `DONE` | `coder` | `Pha 3` | Cross-runtime integration gate | `EV-W22-203` | close failing cross-runtime integration suites + rerun | required slices pass |
| `W22-ISS-004` | P1 | `DONE` | `tester` | `Pha 4` | Integration debt closure | `EV-W22-204` | close debt backlog after `W22-ISS-001/003` unblock | debt open `=0` |
| `W22-ISS-005` | P1 | `DONE` | `planner` | `Pha 4` | Release blocker taxonomy | `EV-W22-208` | complete blocker mapping | taxonomy complete |
| `W22-ISS-006` | P1 | `DONE` | `tester` | `Pha 4` | Correlation/compliance quality | `EV-W22-205`,`EV-W22-206` | correlation/compliance rerun pass | coverage>=99%, findings=0 |
| `W22-ISS-007` | P1 | `DONE` | `tester` | `Pha 5` | Regression guard | `EV-W22-301..306` | close failing guard (`verify_w15_capital_allocation.py`) then rerun | regression guard pass |
| `W22-ISS-008` | P1 | `DONE` | `planner` | `Pha 6` | Final verdict consistency | `EV-W22-401`,`EV-W22-402` | strict artifact reconciliation | one final verdict |
| `W22-ISS-009` | P1 | `DONE` | `planner` | `Pha 7` | W23 handoff | `EV-W22-402` | complete NO-GO recovery queue + W23 priorities/guardrails | start pack complete |
| `W22-ISS-010` | P1 | `DONE` | `planner` | `Pha 5` | Budget governance | `EV-W22-209` | budget within threshold (no escalation required) | budget within threshold or approved escalation |
| `W22-ISS-011` | P2 | `DONE` | `ops` | `Pha 5` | Gate throughput | `EV-W22-210` | capture gate toil watermark | throughput watermark captured |
| `W22-ISS-012` | P2 | `DONE` | `planner` | `Pha 6` | Audit linkage | `EV-W22-205`,`EV-W22-206` | complete evidence linkage | linkage complete |

## 3) Gate blocker policy

- `W22-ISS-001..003` phải `DONE` trước gate lock.
- `P0 open = 0`, `P1 unowned = 0`.
- Không còn mandatory issue ở trạng thái `NEW/IN_PROGRESS/BLOCKED` tại gate cutoff.
