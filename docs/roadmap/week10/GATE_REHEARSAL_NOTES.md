# Gate Rehearsal Notes (Week 10 API Health & SLO)

## Gate rule

`GO` chỉ khi đồng thời:

1. Compile/static/lint/type `100% pass`.
2. Smoke critical path `>=95%`.
3. Correlation coverage critical events `>=99%`.
4. Alert false-positive sample `<=15%`.
5. Alert false-negative critical `=0`.
6. `/health` p95 latency `<=100ms` local/test profile.
7. `/health/ready` correctness `100%`.
8. `/health/live` correctness `100%`.
9. `/api/system/health` p95 latency `<=250ms` local/test profile.
10. WebSocket heartbeat success `>=99%` sample hoặc không miss trong slice.
11. Dashboard SLO panel availability `>=95%`.
12. W05-W09 regression guard pass.
13. Không còn P0 open, không có P1 unowned.
14. Correlation source audit trả `0 findings`.
15. Không còn `CAPTURED_FAIL/BLOCKED_ENV` ở matrix bắt buộc.
16. Baseline/Issue/Gate/KPI/Final report thống nhất một trạng thái cuối.

Nếu thiếu một điều kiện: `NO-GO`.

## Checklist

| Gate item | Expected | Current status | Evidence ID | Verdict | Notes |
|---|---|---|---|---|---|
| Build + static profile | `100% pass` | `CAPTURED_FAIL` | `EV-W10-101..107` | `FAIL` | `EV-W10-102` failed |
| Smoke critical path | `>=95%` | `CAPTURED_PASS` | `EV-W10-103`,`EV-W10-104` | `PASS` | integration + signal flow pass |
| `/health` SLO | p95 `<=100ms` | `CAPTURED_PASS` | `EV-W10-201` | `PASS` | p95 `0.96ms` |
| Readiness correctness | `100%` | `CAPTURED_PASS` | `EV-W10-202` | `PASS` | contract checks pass |
| Liveness correctness | `100%` | `CAPTURED_PASS` | `EV-W10-203` | `PASS` | contract checks pass |
| System health SLO | p95 `<=250ms` | `CAPTURED_PASS` | `EV-W10-204` | `PASS` | p95 `0.61ms` |
| Component health | complete | `CAPTURED_PASS` | `EV-W10-205` | `PASS` | required components present |
| WebSocket heartbeat | `>=99%` sample | `CAPTURED_FAIL` | `EV-W10-206` | `FAIL` | close `1012 service restart`, unstable streaming |
| Event-to-alert latency | `<=120s` temporary target | `BLOCKED_ENV` | `EV-W10-207` | `BLOCKED` | no deterministic replay harness |
| Alert false positive | `<=15%` | `BLOCKED_ENV` | `EV-W10-208` | `BLOCKED` | no labeled sample set |
| Critical false negative | `0` | `BLOCKED_ENV` | `EV-W10-209` | `BLOCKED` | no critical incident replay sample |
| Alert acknowledgement | success `100%` sample | `CAPTURED_PASS` | `EV-W10-210` | `PASS` | endpoint returns structured ack |
| Dashboard SLO panels | availability `>=95%` | `BLOCKED_ENV` | `EV-W10-211` | `BLOCKED` | dashboard runtime probe missing |
| W05-W09 regression | `100% pass` | `CAPTURED_PASS` | `EV-W10-213..217` | `PASS` | guardrail slices pass |
| P0/P1 governance | P0 open `=0`, P1 unowned `=0` | `CAPTURED_FAIL` | `EV-W10-306` | `FAIL` | P0 still BLOCKED |
| Governance consistency | one-decision gate | `CAPTURED_PASS` | `EV-W10-306`,`EV-W10-402` | `PASS` | artifacts synchronized |

## Rehearsal outcome

- Current status: `NO-GO`.
- Final verdict: `NO-GO`.
- Blocking set: `EV-W10-102`, `EV-W10-206`, `EV-W10-207..209`, `EV-W10-211`, `EV-W10-212`.
