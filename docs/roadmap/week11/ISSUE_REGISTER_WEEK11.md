# Issue Register W11 - Incident Runbook

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: mọi P0 open hoặc P1 unowned đều chặn `GO`.

## 2) Issues

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W11-ISS-001` | P0 | `NEW` | `ops` | `Pha 3` | Gate closeout | `EV-W11-210`,`EV-W11-211`,`EV-W11-215` | Chuẩn hóa closeout + postmortem template | closeout evidence completeness `100%` |
| `W11-ISS-002` | P0 | `NEW` | `planner` | `Pha 1` | All drills | `EV-W11-203`,`EV-W11-204`,`EV-W11-212` | Hoàn thiện escalation matrix owner/backup/SLA | owner/SLA matrix complete |
| `W11-ISS-003` | P0 | `NEW` | `ops` | `Pha 4` | P0 incident response | `EV-W11-201`,`EV-W11-213`,`EV-W11-214` | Drill critical alert + ack SLA | P0 ack `<=5m`, critical false-negative `=0` |
| `W11-ISS-004` | P1 | `NEW` | `planner` | `Pha 1` | Severity taxonomy | `EV-W11-202`,`EV-W11-109`,`EV-W11-110` | Reconcile W09/W10 taxonomy into runbook | taxonomy matrix pass |
| `W11-ISS-005` | P1 | `NEW` | `ops` | `Pha 4` | API degraded drill | `EV-W11-101`,`EV-W11-108`,`EV-W11-205` | Drill API degraded path | drill pass + verify evidence |
| `W11-ISS-006` | P1 | `NEW` | `ops` | `Pha 4` | Execution alert drill | `EV-W11-106`,`EV-W11-206` | Drill execution alert triage | drill pass + side-effect context |
| `W11-ISS-007` | P1 | `NEW` | `ops` | `Pha 4` | Circuit breaker drill | `EV-W11-106`,`EV-W11-207` | Drill breaker trip/reset/approval | drill pass + approval evidence |
| `W11-ISS-008` | P1 | `NEW` | `coder` | `Pha 4` | Stale stream drill | `EV-W11-102`,`EV-W11-208` | Drill stale stream detection/reconnect | drill pass + verify cadence |
| `W11-ISS-009` | P1 | `NEW` | `tester` | `Pha 5` | Regression guard | `EV-W11-301..306` | Rerun W05-W10 guardrail slices | regression guard pass `100%` |
| `W11-ISS-010` | P1 | `NEW` | `planner` | `Pha 6` | Gate consistency | `EV-W11-401`,`EV-W11-402` | Reconcile baseline/issues/gate/KPI/final | one final verdict |
| `W11-ISS-011` | P2 | `NEW` | `planner` | `Pha 5` | Change budget | `EV-W11-402` | Add escalation record if budget exceeded | budget ok or justified |
| `W11-ISS-012` | P2 | `NEW` | `ops` | `Pha 5` | Runbook toil | `EV-W11-216` | Capture drill step/time watermark | toil watermark captured |

## 3) Gate blocker policy

- `W11-ISS-001..003` phải `DONE` để W11 có thể `GO`.
- P1 có thể không `DONE` chỉ khi không gate-blocking, có owner + ETA + mitigation + final report acceptance.
- Không được chuyển issue sang `DONE` nếu evidence còn `PENDING_EXECUTION`.
