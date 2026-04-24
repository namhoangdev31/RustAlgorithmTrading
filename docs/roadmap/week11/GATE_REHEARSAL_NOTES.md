# Gate Rehearsal Notes W11 - Incident Runbook

## 1) Gate status

- Current gate status: `PENDING_DECISION`.
- Final verdict: `PENDING_DECISION`.
- Gate rule: W11 chỉ `GO` khi P0/P1 drills pass, closeout evidence đủ, regression guard pass và artifact không mâu thuẫn.

## 2) Mandatory gate checklist

| Gate item | Target | Evidence ID | Current status | Notes |
|---|---|---|---|---|
| P0 open count | `0` | `EV-W11-401` | `PENDING_EXECUTION` | issue register sync required |
| P1 unowned count | `0` | `EV-W11-401` | `PENDING_EXECUTION` | issue register sync required |
| P0 acknowledgement | `<=5m` | `EV-W11-201` | `PENDING_EXECUTION` | drill evidence required |
| P1 acknowledgement | `<=15m` | `EV-W11-202` | `PENDING_EXECUTION` | drill evidence required |
| Escalation matrix | `100%` complete | `EV-W11-212` | `PENDING_EXECUTION` | owner/backup/SLA/ETA |
| Required drills | `100%` pass | `EV-W11-205..209` | `PENDING_EXECUTION` | API, execution, breaker, stale stream, risk breach |
| Closeout evidence | `100%` complete | `EV-W11-210`,`EV-W11-215` | `PENDING_EXECUTION` | verify before resolved |
| Postmortem coverage | `100%` P0/P1 | `EV-W11-211` | `PENDING_EXECUTION` | template complete |
| Critical false-negative | `0` | `EV-W11-213` | `PENDING_EXECUTION` | no missed critical alert |
| Alert false-positive sample | `<=15%` | `EV-W11-214` | `PENDING_EXECUTION` | sample method documented |
| W05-W10 regression guard | `100%` pass | `EV-W11-301..306` | `PENDING_EXECUTION` | no regression |
| Correlation audit | `0 findings` | `EV-W11-110` | `PENDING_EXECUTION` | one-ID policy |
| Artifact consistency | `100%` | `EV-W11-402` | `PENDING_EXECUTION` | one final verdict |

## 3) Drill rehearsal script

For each required drill:

1. Trigger or simulate alert.
2. Capture alert timestamp and evidence ID.
3. Acknowledge alert and capture timestamp.
4. Assign owner + backup owner.
5. Triage severity/component/reason.
6. Execute mitigation action.
7. Verify recovery or containment.
8. Close incident only after verify evidence exists.
9. Create postmortem/action item if P0/P1.
10. Update issue register and baseline matrix.

## 4) Decision logic

- Any mandatory `CAPTURED_FAIL` => `NO-GO`.
- Any mandatory `BLOCKED_ENV` without owner/ETA => `NO-GO`.
- Any P0 open => `NO-GO`.
- Any P1 unowned => `NO-GO`.
- Any artifact disagreement => `NO-GO`.
- All mandatory evidence `CAPTURED_PASS` and no blockers => `GO`.

## 5) Reconciliation order

1. `INCIDENT_RUNBOOK_BASELINE_REPORT.md`.
2. `ISSUE_REGISTER_WEEK11.md`.
3. `KPI_CHARTER_WEEK11.md`.
4. `GATE_REHEARSAL_NOTES.md`.
5. `WEEK11_FINAL_REPORT_AND_WEEK12_START_PACK.md`.
