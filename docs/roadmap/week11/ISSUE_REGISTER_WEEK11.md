# Issue Register W11 - Incident Runbook

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: mọi P0 open hoặc P1 unowned đều chặn `GO`.

## 2) Issues (snapshot 2026-04-27)

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W11-ISS-001` | P0 | `DONE` | `ops` | `2026-04-27` | Gate closeout | `EV-W11-210`,`EV-W11-211`,`EV-W11-215` | Chuẩn hóa closeout + postmortem + verify evidence chain | closeout evidence completeness `100%` |
| `W11-ISS-002` | P0 | `DONE` | `planner` | `2026-04-27` | All drills | `EV-W11-203`,`EV-W11-204`,`EV-W11-212` | Hoàn thiện escalation owner/backup/SLA theo drill runtime | owner/SLA matrix complete + runtime proof |
| `W11-ISS-003` | P0 | `DONE` | `ops` | `2026-04-27` | P0 incident response | `EV-W11-201`,`EV-W11-213`,`EV-W11-214` | Rerun critical alert drill + ack SLA capture | P0 ack `<=5m`, critical false-negative `=0` |
| `W11-ISS-004` | P1 | `DONE` | `planner` | `2026-04-27` | Severity taxonomy | `EV-W11-202`,`EV-W11-109`,`EV-W11-110` | Reconcile taxonomy matrix with runtime incident fields | taxonomy matrix pass |
| `W11-ISS-005` | P1 | `DONE` | `ops` | `2026-04-27` | API degraded drill | `EV-W11-101`,`EV-W11-108`,`EV-W11-205` | Ổn định API startup + rerun API degraded drill | drill pass + verify evidence |
| `W11-ISS-006` | P1 | `DONE` | `ops` | `2026-04-27` | Execution alert drill | `EV-W11-106`,`EV-W11-206` | Drill execution alert triage + side-effect verification | drill pass + side-effect context |
| `W11-ISS-007` | P1 | `DONE` | `ops` | `2026-04-27` | Circuit breaker drill | `EV-W11-106`,`EV-W11-207` | Drill breaker trip/reset/approval và record approval path | drill pass + approval evidence |
| `W11-ISS-008` | P1 | `DONE` | `coder` | `2026-04-27` | Stale stream drill | `EV-W11-102`,`EV-W11-208` | Khắc phục scaling/perf rồi rerun stale stream reconnect drill | drill pass + verify cadence |
| `W11-ISS-009` | P1 | `DONE` | `tester` | `2026-04-27` | Regression guard | `EV-W11-301..306` | Rerun W05-W10 guardrail slices sau khi fix blockers | regression guard pass `100%` |
| `W11-ISS-010` | P1 | `DONE` | `planner` | `2026-04-27` | Gate consistency | `EV-W11-401`,`EV-W11-402` | Đồng bộ baseline/issues/gate/KPI/final verdict | one final verdict |
| `W11-ISS-011` | P2 | `IN_PROGRESS` | `planner` | `2026-04-28` | Change budget | `EV-W11-402` | Theo dõi budget trong recovery queue | budget ok or justified |
| `W11-ISS-012` | P2 | `IN_PROGRESS` | `ops` | `2026-04-28` | Runbook toil | `EV-W11-216` | Capture drill step/time watermark trong rerun | toil watermark captured |

## 3) Gate blocker policy

- `W11-ISS-001..003` phải `DONE` để W11 có thể `GO`.
- P1 có thể không `DONE` chỉ khi không gate-blocking, có owner + ETA + mitigation + final report acceptance.
- Không được chuyển issue sang `DONE` nếu evidence còn `PENDING_EXECUTION`.

## 4) Current gate assessment

- P0 open count: `0`.
- P1 unowned count: `0`.
- Current verdict: `GO`.
