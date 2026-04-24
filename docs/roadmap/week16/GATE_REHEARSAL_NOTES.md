# Gate Rehearsal Notes W16 - Research Reproducibility

## 1) Gate status

- Current gate status: `PENDING_DECISION`.
- Final verdict: `PENDING_DECISION`.
- Gate rule: W16 chỉ `GO` khi seed control + deterministic rerun enforce đúng policy, drift trong ngưỡng, exception handling nhất quán và artifacts không mâu thuẫn.

## 2) Mandatory gate checklist

| Gate item | Target | Evidence ID | Current status | Notes |
|---|---|---|---|---|
| Seed-control compliance | `100%` | `EV-W16-201` | `PENDING_EXECUTION` | required runs seeded |
| Deterministic rerun coverage | `100%` | `EV-W16-202` | `PENDING_EXECUTION` | required profiles enforced |
| Reproducibility checklist completeness | `100%` | `EV-W16-203` | `PENDING_EXECUTION` | mandatory items required |
| Reproducibility decision traceability | `100%` | `EV-W16-204` | `PENDING_EXECUTION` | owner+reason+evidence |
| Multi-rerun consistency pass | `100%` scenarios | `EV-W16-205` | `PENDING_EXECUTION` | consistency required |
| Reproducibility drift | `<=1%` | `EV-W16-206` | `PENDING_EXECUTION` | phase-4 threshold |
| Exception-handling consistency | `100%` | `EV-W16-207` | `PENDING_EXECUTION` | policy consistency |
| New-breach count | `0` | `EV-W16-208` | `PENDING_EXECUTION` | risk boundary guard |
| Correlation coverage | `>=99%` | `EV-W16-209` | `PENDING_EXECUTION` | carry-over threshold |
| Compliance findings | `0` | `EV-W16-210` | `PENDING_EXECUTION` | audit closure |
| P0 open count | `0` | `EV-W16-209` | `PENDING_EXECUTION` | issue register sync |
| P1 unowned count | `0` | `EV-W16-210` | `PENDING_EXECUTION` | issue register sync |
| W09-W15 regression guard | `100%` pass | `EV-W16-301..306` | `PENDING_EXECUTION` | no regression |
| Artifact consistency | `100%` | `EV-W16-401`,`EV-W16-402` | `PENDING_EXECUTION` | one final verdict |

## 3) Rehearsal flow

1. Run command profile và capture baseline evidence.
2. Run seed-control enforcement rehearsals.
3. Run deterministic rerun rehearsals.
4. Run multi-rerun consistency rehearsals.
5. Run exception-handling consistency checks.
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

1. `RESEARCH_REPRODUCIBILITY_BASELINE_REPORT.md`.
2. `ISSUE_REGISTER_WEEK16.md`.
3. `KPI_CHARTER_WEEK16.md`.
4. `GATE_REHEARSAL_NOTES.md`.
5. `WEEK16_FINAL_REPORT_AND_WEEK17_START_PACK.md`.
