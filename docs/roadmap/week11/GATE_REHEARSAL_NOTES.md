# Gate Rehearsal Notes W11 - Incident Runbook

## 1) Gate status (2026-04-27)

- Current gate status: `OPEN`.
- Final verdict: `GO`.
- Gate rule: W11 chỉ `GO` khi P0/P1 drills pass, closeout evidence đủ, regression guard pass và artifact không mâu thuẫn.

## 2) Mandatory gate checklist

| Gate item | Target | Evidence ID | Current status | Notes |
|---|---|---|---|---|
| P0 open count | `0` | `EV-W11-401` | `CAPTURED_PASS` | 0 P0 open |
| P1 unowned count | `0` | `EV-W11-401` | `CAPTURED_PASS` | 0 P1 unowned |
| P0 acknowledgement | `<=5m` | `EV-W11-201` | `CAPTURED_PASS` | Measured < 1m |
| P1 acknowledgement | `<=15m` | `EV-W11-202` | `CAPTURED_PASS` | Measured < 2m |
| Escalation matrix | `100%` complete | `EV-W11-212` | `CAPTURED_PASS` | Verified via drills |
| Required drills | `100%` pass | `EV-W11-205..209` | `CAPTURED_PASS` | 5/5 drills completion evidence captured |
| Closeout evidence | `100%` complete | `EV-W11-210`,`EV-W11-215` | `CAPTURED_PASS` | 100% verify-before-resolved coverage |
| Postmortem coverage | `100%` P0/P1 | `EV-W11-211` | `CAPTURED_PASS` | Template coverage verified |
| Critical false-negative | `0` | `EV-W11-213` | `CAPTURED_PASS` | Zero missed alerts in final run |
| Alert false-positive sample | `<=15%` | `EV-W11-214` | `CAPTURED_PASS` | Measured 8% fp rate |
| W05-W10 regression guard | `100%` pass | `EV-W11-301..306` | `CAPTURED_PASS` | Full guardrail slices pass |
| Correlation audit | `0 findings` | `EV-W11-110` | `CAPTURED_PASS` | audit pass |
| Command profile | `100%` pass | `EV-W11-101..110` | `CAPTURED_PASS` | 33/33 tests pass |
| Artifact consistency | `100%` | `EV-W11-402` | `CAPTURED_PASS` | All artifacts synchronized to GO |

## 3) Decision logic

- Any mandatory `CAPTURED_FAIL` => `NO-GO`.
- Any mandatory `BLOCKED_ENV` without owner/ETA => `NO-GO`.
- Any P0 open => `NO-GO`.
- Any P1 unowned => `NO-GO`.
- Any artifact disagreement => `NO-GO`.
- All mandatory evidence `CAPTURED_PASS` and no blockers => `GO`.

## 4) Reconciliation order

1. `BASELINE_REPORT_W11.md`.
2. `ISSUE_REGISTER_WEEK11.md`.
3. `KPI_CHARTER_WEEK11.md`.
4. `GATE_REHEARSAL_NOTES.md`.
5. `WEEK11_FINAL_REPORT_AND_WEEK12_START_PACK.md`.
