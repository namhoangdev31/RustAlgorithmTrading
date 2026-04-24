# Gate Rehearsal Notes W14 - Portfolio Controls

## 1) Gate status

- Current gate status: `PENDING_DECISION`.
- Final verdict: `PENDING_DECISION`.
- Gate rule: W14 chỉ `GO` khi exposure/concentration controls enforce đúng policy, breach mới bằng 0, drift/risk guard pass và artifacts không mâu thuẫn.

## 2) Mandatory gate checklist

| Gate item | Target | Evidence ID | Current status | Notes |
|---|---|---|---|---|
| Exposure control enforcement | `100%` | `EV-W14-201` | `PENDING_EXECUTION` | required checks enforced |
| Concentration control enforcement | `100%` | `EV-W14-202` | `PENDING_EXECUTION` | required checks enforced |
| Portfolio controls checklist completeness | `100%` | `EV-W14-203` | `PENDING_EXECUTION` | mandatory items required |
| Portfolio decision traceability | `100%` | `EV-W14-204` | `PENDING_EXECUTION` | owner+reason+evidence |
| Cross-strategy interaction coverage | `100%` | `EV-W14-205` | `PENDING_EXECUTION` | required scenarios covered |
| Exposure breach mới | `0` | `EV-W14-206` | `PENDING_EXECUTION` | phase-4 threshold |
| Concentration breach mới | `0` | `EV-W14-207` | `PENDING_EXECUTION` | phase-4 threshold |
| Reproducibility drift | `<=1%` | `EV-W14-208` | `PENDING_EXECUTION` | phase-4 threshold |
| Correlation coverage | `>=99%` | `EV-W14-209` | `PENDING_EXECUTION` | carry-over threshold |
| Compliance findings | `0` | `EV-W14-210` | `PENDING_EXECUTION` | audit closure |
| P0 open count | `0` | `EV-W14-209` | `PENDING_EXECUTION` | issue register sync |
| P1 unowned count | `0` | `EV-W14-210` | `PENDING_EXECUTION` | issue register sync |
| W09-W13 regression guard | `100%` pass | `EV-W14-301..306` | `PENDING_EXECUTION` | no regression |
| Artifact consistency | `100%` | `EV-W14-401`,`EV-W14-402` | `PENDING_EXECUTION` | one final verdict |

## 3) Rehearsal flow

1. Run command profile và capture baseline evidence.
2. Run exposure/concentration enforcement rehearsals.
3. Run cross-strategy interaction rehearsals.
4. Run drift/risk guard checks.
5. Rerun baseline sau hardening.
6. Reconcile artifacts theo thứ tự cố định.
7. Lock final verdict.

## 4) Decision logic

- Any mandatory `CAPTURED_FAIL` => `NO-GO`.
- Any mandatory `BLOCKED_ENV` without owner/ETA => `NO-GO`.
- Any P0 open => `NO-GO`.
- Any P1 unowned => `NO-GO`.
- Any artifact disagreement => `NO-GO`.
- All mandatory evidence `CAPTURED_PASS` and no blockers => `GO`.

## 5) Reconciliation order

1. `PORTFOLIO_CONTROLS_BASELINE_REPORT.md`.
2. `ISSUE_REGISTER_WEEK14.md`.
3. `KPI_CHARTER_WEEK14.md`.
4. `GATE_REHEARSAL_NOTES.md`.
5. `WEEK14_FINAL_REPORT_AND_WEEK15_START_PACK.md`.
