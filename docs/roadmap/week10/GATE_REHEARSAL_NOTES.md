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
10. WebSocket heartbeat success `>=99%` sample or no missed heartbeat in test slice.
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
| Build + static profile | `100% pass` | `PENDING_EXECUTION` | `EV-W10-101..107` | `PENDING` | chưa capture |
| Smoke critical path | `>=95%` | `PENDING_EXECUTION` | `EV-W10-103`,`EV-W10-104` | `PENDING` | chưa capture |
| `/health` SLO | p95 `<=100ms` | `PENDING_EXECUTION` | `EV-W10-201` | `PENDING` | local/test profile |
| Readiness correctness | `100%` | `PENDING_EXECUTION` | `EV-W10-202` | `PENDING` | ready/not-ready scenarios |
| Liveness correctness | `100%` | `PENDING_EXECUTION` | `EV-W10-203` | `PENDING` | lightweight check |
| System health SLO | p95 `<=250ms` | `PENDING_EXECUTION` | `EV-W10-204` | `PENDING` | stable schema |
| Component health | complete | `PENDING_EXECUTION` | `EV-W10-205` | `PENDING` | degraded reasons |
| WebSocket heartbeat | `>=99%` sample | `PENDING_EXECUTION` | `EV-W10-206` | `PENDING` | stream health |
| Event-to-alert latency | `<=120s` temporary target | `PENDING_EXECUTION` | `EV-W10-207` | `PENDING` | W10 target |
| Alert false positive | `<=15%` | `PENDING_EXECUTION` | `EV-W10-208` | `PENDING` | sample method required |
| Critical false negative | `0` | `PENDING_EXECUTION` | `EV-W10-209` | `PENDING` | gate blocker |
| Alert acknowledgement | success `100%` sample | `PENDING_EXECUTION` | `EV-W10-210` | `PENDING` | structured ack |
| Dashboard SLO panels | availability `>=95%` | `PENDING_EXECUTION` | `EV-W10-211` | `PENDING` | SLO panels |
| W05-W09 regression | `100% pass` | `PENDING_EXECUTION` | `EV-W10-213..217` | `PENDING` | risk/stop/breaker/retry/obs |
| P0/P1 governance | P0 open `=0`, P1 unowned `=0` | `PENDING_EXECUTION` | `EV-W10-306` | `PENDING` | issue register initial state |
| Governance consistency | one-decision gate | `PENDING_EXECUTION` | `EV-W10-306`,`EV-W10-402` | `PENDING` | docs sync pending |

## Rehearsal outcome

- Current status: `PENDING_DECISION`.
- Final verdict: `PENDING_DECISION` cho đến khi baseline và scenario matrix có evidence thật.
- Rule capture: không dùng placeholder ở mục đã chạy; phải ghi `actual` + trạng thái evidence tương ứng.
