# Gate Rehearsal Notes W14 - Portfolio Controls

## 1) Gate status

- Current gate status: `GO`.
- Final verdict: `GO`.
- Gate rule: W14 chỉ `GO` khi exposure/concentration controls enforce đúng policy, breach mới bằng 0, drift/risk guard pass và artifacts không mâu thuẫn.

## 2) Mandatory gate checklist

| Gate item | Target | Evidence ID | Current status | Notes |
|---|---|---|---|---|
| Exposure control enforcement | `100%` | `EV-W14-201` | `CAPTURED_PASS` | required checks enforced |
| Concentration control enforcement | `100%` | `EV-W14-202` | `CAPTURED_PASS` | required checks enforced |
| Portfolio controls checklist completeness | `100%` | `EV-W14-203` | `CAPTURED_PASS` | mandatory items complete |
| Portfolio decision traceability | `100%` | `EV-W14-204` | `CAPTURED_PASS` | owner+reason+evidence complete |
| Cross-strategy interaction coverage | `100%` | `EV-W14-205` | `CAPTURED_PASS` | required scenarios covered |
| Exposure breach mới | `0` | `EV-W14-206` | `CAPTURED_PASS` | phase-4 threshold met |
| Concentration breach mới | `0` | `EV-W14-207` | `CAPTURED_PASS` | phase-4 threshold met |
| Reproducibility drift | `<=1%` | `EV-W14-208` | `CAPTURED_PASS` | measured `0.5000%` |
| Correlation coverage | `>=99%` | `EV-W14-209` | `CAPTURED_PASS` | no correlation gaps found |
| Compliance findings | `0` | `EV-W14-210` | `CAPTURED_PASS` | findings `0` |
| P0 open count | `0` | `EV-W14-209` | `CAPTURED_PASS` | issue register sync: `0` |
| P1 unowned count | `0` | `EV-W14-210` | `CAPTURED_PASS` | issue register sync: `0` |
| W09-W13 regression guard | `100%` pass | `EV-W14-301..306` | `CAPTURED_PASS` | no regression |
| Artifact consistency | `100%` | `EV-W14-401`,`EV-W14-402` | `CAPTURED_PASS` | one final verdict `GO` |

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
