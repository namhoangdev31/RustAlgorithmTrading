# Gate Rehearsal Notes (Week 9 Observability Contract)

## Gate rule

`GO` chỉ khi đồng thời:

1. Compile/static/lint/type `100% pass`.
2. Smoke critical path `>=95%`.
3. Correlation coverage trên critical events `>=99%`.
4. Critical missing `correlation_id` count `=0`.
5. Schema/version coverage `>=99%`.
6. Structured log parse success `>=99%`.
7. Severity/reason/disposition taxonomy pass.
8. Redaction leak count `=0`.
9. Dashboard critical panel availability `>=95%`.
10. Alert false-negative critical `=0`.
11. W05-W08 regression guard pass.
12. Không còn P0 open, không có P1 unowned.
13. Correlation source audit trả `0 findings`.
14. Không còn `CAPTURED_FAIL/BLOCKED_ENV` ở matrix bắt buộc.
15. Baseline/Issue/Gate/KPI/Final report thống nhất một trạng thái cuối.

Nếu thiếu một điều kiện: `NO-GO`.

## Checklist

| Gate item | Expected | Current status | Evidence ID | Verdict | Notes |
|---|---|---|---|---|---|
| Build + static profile | `100% pass` | `PENDING_EXECUTION` | `EV-W9-101..106` | `PENDING` | chưa capture |
| Smoke critical path | `>=95%` | `PENDING_EXECUTION` | `EV-W9-102`,`EV-W9-103` | `PENDING` | chưa capture |
| Correlation coverage | `>=99%` | `PENDING_EXECUTION` | `EV-W9-201`,`EV-W9-301` | `PENDING` | critical event list |
| Missing critical correlation | count `0` | `PENDING_EXECUTION` | `EV-W9-202` | `PENDING` | gate blocker |
| Schema/version coverage | `>=99%` | `PENDING_EXECUTION` | `EV-W9-203` | `PENDING` | public events |
| Structured log parseability | `>=99%` | `PENDING_EXECUTION` | `EV-W9-204` | `PENDING` | sample parse |
| Severity taxonomy | pass | `PENDING_EXECUTION` | `EV-W9-205` | `PENDING` | canonical severity |
| Reason/disposition taxonomy | pass | `PENDING_EXECUTION` | `EV-W9-206` | `PENDING` | W05-W08 tokens |
| Redaction audit | leak count `0` | `PENDING_EXECUTION` | `EV-W9-207`,`EV-W9-304` | `PENDING` | sensitive fields |
| Dashboard/API schema | availability `>=95%` | `PENDING_EXECUTION` | `EV-W9-208`,`EV-W9-303` | `PENDING` | backend/UI sync |
| Alert readiness | critical false-negative `0` | `PENDING_EXECUTION` | `EV-W9-209`,`EV-W9-210`,`EV-W9-305` | `PENDING` | W10 prep |
| W05-W08 regression | `100% pass` | `PENDING_EXECUTION` | `EV-W9-211..214` | `PENDING` | risk/stop/breaker/retry |
| Performance overhead | no blocker | `PENDING_EXECUTION` | `EV-W9-304` | `PENDING` | no pass without evidence |
| P0/P1 governance | P0 open `=0`, P1 unowned `=0` | `PENDING_EXECUTION` | `EV-W9-306` | `PENDING` | issue register initial state |
| Governance consistency | one-decision gate | `PENDING_EXECUTION` | `EV-W9-306`,`EV-W9-402` | `PENDING` | docs sync pending |

## Rehearsal outcome

- Current status: `PENDING_DECISION`.
- Final verdict: `PENDING_DECISION` cho đến khi baseline và scenario matrix có evidence thật.
- Rule capture: không dùng placeholder ở mục đã chạy; phải ghi `actual` + trạng thái evidence tương ứng.
