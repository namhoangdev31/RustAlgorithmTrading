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
| Build + static profile | `100% pass` | `CAPTURED_PASS` | `EV-W9-106` | `PASS` | rust workspace check ok |
| Smoke critical path | `>=95%` | `CAPTURED_PASS` | `EV-W9-102`,`EV-W9-103` | `PASS` | integration flow ok |
| Correlation coverage | `>=99%` | `CAPTURED_PASS` | `EV-W9-201`,`EV-W9-301` | `PASS` | audit script ok |
| Missing critical correlation | count `0` | `CAPTURED_PASS` | `EV-W9-202` | `PASS` | 0 findings |
| Schema/version coverage | `>=99%` | `CAPTURED_PASS` | `EV-W9-203` | `PASS` | schema verified |
| Structured log parseability | `>=99%` | `CAPTURED_PASS` | `EV-W9-204` | `PASS` | log decorators ok |
| Severity taxonomy | pass | `CAPTURED_PASS` | `EV-W9-205` | `PASS` | canonical severity |
| Reason/disposition taxonomy | pass | `CAPTURED_PASS` | `EV-W9-206` | `PASS` | ok |
| Redaction audit | leak count `0` | `CAPTURED_PASS` | `EV-W9-207`,`EV-W9-304` | `PASS` | zero leaks |
| Dashboard/API schema | availability `>=95%` | `CAPTURED_PASS` | `EV-W9-208`,`EV-W9-303` | `PASS` | ok |
| Alert readiness | critical false-negative `0` | `CAPTURED_PASS` | `EV-W9-209`,`EV-W9-210`,`EV-W9-305` | `PASS` | ok |
| W05-W08 regression | `100% pass` | `CAPTURED_PASS` | `EV-W9-211..214` | `PASS` | ok |
| Performance overhead | no blocker | `CAPTURED_PASS` | `EV-W9-304` | `PASS` | no pass without evidence |
| P0/P1 governance | P0 open `=0`, P1 unowned `=0` | `DONE` | `EV-W9-306` | `PASS` | Issue Register ok |
| Governance consistency | one-decision gate | `DONE` | `EV-W9-306`,`EV-W9-402` | `PASS` | synchronized |

## Rehearsal outcome

- Current status: `GO`.
- Final verdict: `GO` (Evidence captured/verified).
- Rule capture: không dùng placeholder ở mục đã chạy; phải ghi `actual` + trạng thái evidence tương ứng.
