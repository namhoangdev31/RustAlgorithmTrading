# Gate Rehearsal Notes W15 - Capital Allocation

## 1) Gate status

- Current gate status: `GO`.
- Final verdict: `GO`.
- Gate rule: W15 chỉ `GO` khi volatility/regime sizing và drawdown adherence enforce đúng policy, breach mới bằng 0, drift guard pass và artifacts không mâu thuẫn.

## 2) Mandatory gate checklist

| Gate item | Target | Evidence ID | Current status | Notes |
|---|---|---|---|---|
| Volatility sizing enforcement | `100%` | `EV-W15-201` | `CAPTURED_PASS` | required checks enforced |
| Regime-aware sizing enforcement | `100%` | `EV-W15-202` | `CAPTURED_PASS` | required checks enforced |
| Allocation checklist completeness | `100%` | `EV-W15-203` | `CAPTURED_PASS` | mandatory items complete |
| Allocation decision traceability | `100%` | `EV-W15-204` | `CAPTURED_PASS` | owner+reason+evidence complete |
| Drawdown adherence | `100%` | `EV-W15-205` | `CAPTURED_PASS` | policy adherence |
| Cross-strategy interaction coverage | `100%` | `EV-W15-206` | `CAPTURED_PASS` | required scenarios covered |
| New-breach count | `0` | `EV-W15-207` | `CAPTURED_PASS` | threshold met |
| Reproducibility drift | `<=1%` | `EV-W15-208` | `CAPTURED_PASS` | measured `0.5000%` |
| Correlation coverage | `>=99%` | `EV-W15-209` | `CAPTURED_PASS` | coverage checks passed |
| Compliance findings | `0` | `EV-W15-210` | `CAPTURED_PASS` | findings `0` |
| P0 open count | `0` | `EV-W15-209` | `CAPTURED_PASS` | issue register sync: `0` |
| P1 unowned count | `0` | `EV-W15-210` | `CAPTURED_PASS` | issue register sync: `0` |
| W09-W14 regression guard | `100%` pass | `EV-W15-301..306` | `CAPTURED_PASS` | no regression |
| Artifact consistency | `100%` | `EV-W15-401`,`EV-W15-402` | `CAPTURED_PASS` | one final verdict `GO` |

## 3) Rehearsal flow

1. Run command profile và capture baseline evidence.
2. Run volatility/regime sizing rehearsals.
3. Run drawdown adherence rehearsals.
4. Run cross-strategy interaction rehearsals.
5. Run drift/risk guard checks.
6. Rerun baseline sau hardening.
7. Reconcile artifacts theo thứ tự cố định.
8. Lock final verdict.

## 4) Decision logic

- Any mandatory `CAPTURED_FAIL` => `NO-GO`.
- Any mandatory `BLOCKED_ENV` without owner/ETA => `NO-GO`.
- Any P0 open => `NO-GO`.
- Any P1 unowned => `NO-GO`.
- Any artifact disagreement => `NO-GO`.
- All mandatory evidence `CAPTURED_PASS` and no blockers => `GO`.

## 5) Reconciliation order

1. `CAPITAL_ALLOCATION_BASELINE_REPORT.md`.
2. `ISSUE_REGISTER_WEEK15.md`.
3. `KPI_CHARTER_WEEK15.md`.
4. `GATE_REHEARSAL_NOTES.md`.
5. `WEEK15_FINAL_REPORT_AND_WEEK16_START_PACK.md`.
