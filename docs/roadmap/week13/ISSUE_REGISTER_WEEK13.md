# Issue Register W13 - Strategy Governance

## 1) Status taxonomy

- Issue status: `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- Evidence status: `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV`.
- Gate blockers: mọi P0 open hoặc P1 unowned đều chặn `GO`.

## 2) Issues (snapshot 2026-04-27, post-hardening rerun)

| Issue ID | Severity | Status | Owner | ETA | Blocking of | Evidence ID | Mitigation | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| `W13-ISS-001` | P0 | `DONE` | `planner` | `2026-04-27` | Strategy evidence gate | `EV-W13-203`,`EV-W13-214` | enforce block-by-default on missing mandatory evidence | missing-evidence strategies blocked `100%` |
| `W13-ISS-002` | P0 | `DONE` | `ops` | `2026-04-27` | Decision auditability | `EV-W13-204` | backfill+enforce mandatory decision trace fields (`owner`,`rationale`,`evidence_links`,`next_action`,`eta`) | decision trace completeness `100%` |
| `W13-ISS-003` | P0 | `DONE` | `planner` | `2026-04-27` | Final verdict | `EV-W13-401`,`EV-W13-402` | strict artifact reconciliation and single verdict lock | one final verdict locked (`GO`) |
| `W13-ISS-004` | P1 | `DONE` | `tester` | `2026-04-27` | OOS governance | `EV-W13-101`,`EV-W13-201` | fix Python import/packaging pathing and rerun OOS enforcement | OOS checklist completeness `100%` |
| `W13-ISS-005` | P1 | `DONE` | `tester` | `2026-04-27` | Walk-forward governance | `EV-W13-102`,`EV-W13-202` | fix integration pathing/data fallback and rerun WF enforcement | walk-forward checklist completeness `100%` |
| `W13-ISS-006` | P1 | `DONE` | `tester` | `2026-04-27` | Strategy quality guard | `EV-W13-205` | execute drift audit rerun after command-profile recovery | reproducibility drift `<=1%` |
| `W13-ISS-007` | P1 | `DONE` | `ops` | `2026-04-27` | Risk boundary guard | `EV-W13-106`,`EV-W13-206` | rerun risk guardrail audit and confirm zero new breaches | new breach count `=0` |
| `W13-ISS-008` | P1 | `DONE` | `tester` | `2026-04-27` | Regression guard | `EV-W13-301..306` | rerun W09-W12 guardrails after hardening | regression guard pass |
| `W13-ISS-009` | P1 | `DONE` | `planner` | `2026-04-27` | W14 handoff | `EV-W13-216`,`EV-W13-402` | finalize W14 start-pack after GO lock | start-pack complete |
| `W13-ISS-010` | P1 | `DONE` | `planner` | `2026-04-27` | Governance stability | `EV-W13-402` | validate W13 budget adherence/escalation policy before verdict lock | budget policy satisfied for W13 closeout |
| `W13-ISS-011` | P2 | `DONE` | `ops` | `2026-04-27` | Ops throughput | `EV-W13-213` | capture strategy review throughput watermark from decision inventory | throughput watermark captured |
| `W13-ISS-012` | P2 | `DONE` | `planner` | `2026-04-27` | Audit readiness | `EV-W13-207`,`EV-W13-208`,`EV-W13-212` | complete checklist->decision->gate linkage audit | linkage complete + audit pass |

## 3) Gate blocker policy

- `W13-ISS-001..003` phải `DONE` để W13 có thể `GO`.
- P1 có thể không `DONE` chỉ khi không gate-blocking, có owner + ETA + mitigation + final report acceptance.
- Không được chuyển issue sang `DONE` nếu evidence còn `PENDING_EXECUTION`.

## 4) Current gate assessment

- P0 open count: `0`.
- P1 unowned count: `0`.
- Current verdict: `GO`.
- Mandatory failures: `none`.
