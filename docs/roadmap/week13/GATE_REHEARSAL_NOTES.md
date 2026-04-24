# Gate Rehearsal Notes W13 - Strategy Governance

## 1) Gate status

- Current gate status: `PENDING_DECISION`.
- Final verdict: `PENDING_DECISION`.
- Gate rule: W13 chỉ `GO` khi OOS/walk-forward enforcement pass, strategy evidence gate hoạt động đúng, drift/risk guard pass và artifacts không mâu thuẫn.

## 2) Mandatory gate checklist

| Gate item | Target | Evidence ID | Current status | Notes |
|---|---|---|---|---|
| OOS checklist completeness | `100%` | `EV-W13-201` | `PENDING_EXECUTION` | mandatory items required |
| Walk-forward checklist completeness | `100%` | `EV-W13-202` | `PENDING_EXECUTION` | mandatory items required |
| Strategy evidence gate enforcement | `100%` | `EV-W13-203` | `PENDING_EXECUTION` | missing evidence must block |
| Strategy decision traceability | `100%` | `EV-W13-204` | `PENDING_EXECUTION` | owner+rationale+evidence |
| Reproducibility drift | `<=1%` | `EV-W13-205` | `PENDING_EXECUTION` | phase-4 threshold |
| Exposure/concentration breach mới | `0` | `EV-W13-206` | `PENDING_EXECUTION` | phase-4 threshold |
| Correlation coverage | `>=99%` | `EV-W13-207` | `PENDING_EXECUTION` | carry-over threshold |
| Compliance findings | `0` | `EV-W13-208` | `PENDING_EXECUTION` | audit closure |
| P0 open count | `0` | `EV-W13-209` | `PENDING_EXECUTION` | issue register sync |
| P1 unowned count | `0` | `EV-W13-210` | `PENDING_EXECUTION` | issue register sync |
| W09-W12 regression guard | `100%` pass | `EV-W13-301..306` | `PENDING_EXECUTION` | no regression |
| Artifact consistency | `100%` | `EV-W13-401`,`EV-W13-402` | `PENDING_EXECUTION` | one final verdict |

## 3) Rehearsal flow

1. Run command profile và capture baseline evidence.
2. Run OOS/walk-forward enforcement rehearsals.
3. Audit strategy decision traceability.
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

1. `STRATEGY_GOVERNANCE_BASELINE_REPORT.md`.
2. `ISSUE_REGISTER_WEEK13.md`.
3. `KPI_CHARTER_WEEK13.md`.
4. `GATE_REHEARSAL_NOTES.md`.
5. `WEEK13_FINAL_REPORT_AND_WEEK14_START_PACK.md`.
