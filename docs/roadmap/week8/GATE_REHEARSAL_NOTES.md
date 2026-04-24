# Gate Rehearsal Notes (Week 8 Execution Retry/Slippage)

## Gate rule

`GO` chỉ khi đồng thời:

1. Compile/static/lint/type `100% pass`.
2. Smoke critical path `>=95%`.
3. Retry classification matrix `=100%` trên mandatory scenarios.
4. Duplicate order rate `<=0.1%`.
5. Client order id stability `=100%` cho retry cùng logical order.
6. Non-retryable retry count `=0`.
7. Risk-off bypass count `=0`.
8. Slippage invalid/NaN/Inf acceptance `=0`.
9. Slippage breach route count `=0`.
10. W05/W06/W07 regression guard pass.
11. Execution event correlation continuity `=100%`.
12. Metrics/log metadata completeness pass.
13. Không còn P0 open, không có P1 unowned.
14. Correlation source audit trả `0 findings`.
15. Không còn `CAPTURED_FAIL/BLOCKED_ENV` ở matrix bắt buộc.
16. Baseline/Issue/Gate/KPI/Final report thống nhất một trạng thái cuối.

Nếu thiếu một điều kiện: `NO-GO`.

## Checklist

| Gate item | Expected | Current status | Evidence ID | Verdict | Notes |
|---|---|---|---|---|---|
| Build + static profile | `100% pass` | `PENDING_EXECUTION` | `EV-W8-103..105` | `PENDING` | chưa capture |
| Smoke critical path | `>=95%` | `PENDING_EXECUTION` | `EV-W8-101`,`EV-W8-102` | `PENDING` | chưa capture |
| Retry classification matrix | `100%` | `PENDING_EXECUTION` | `EV-W8-201..206`,`EV-W8-301` | `PENDING` | retryable/non-retryable |
| Duplicate order guard | duplicate rate `<=0.1%` | `PENDING_EXECUTION` | `EV-W8-207`,`EV-W8-302` | `PENDING` | idempotency path |
| Client order id stability | `100%` | `PENDING_EXECUTION` | `EV-W8-208` | `PENDING` | same logical order |
| Risk-off bypass | bypass count `=0` | `PENDING_EXECUTION` | `EV-W8-209`,`EV-W8-304` | `PENDING` | W07 guardrail |
| Slippage boundary | invalid acceptance `=0` | `PENDING_EXECUTION` | `EV-W8-210..213`,`EV-W8-303` | `PENDING` | zero/negative/NaN/Inf/breach |
| Stop-loss close replay | no duplicate close | `PENDING_EXECUTION` | `EV-W8-214` | `PENDING` | W06 guardrail |
| W05/W06/W07 regression | `100% pass` | `PENDING_EXECUTION` | `EV-W8-215..217` | `PENDING` | risk/stop/breaker |
| Execution correlation | `100%` | `PENDING_EXECUTION` | `EV-W8-107`,`EV-W8-108`,`EV-W8-304` | `PENDING` | audit + event metadata |
| Metrics/log metadata | complete | `PENDING_EXECUTION` | `EV-W8-305` | `PENDING` | retry/slippage metrics if added |
| Performance overhead | no blocker | `PENDING_EXECUTION` | `EV-W8-306` | `PENDING` | no pass without evidence |
| P0/P1 governance | P0 open `=0`, P1 unowned `=0` | `PENDING_EXECUTION` | `EV-W8-307` | `PENDING` | issue register initial state |
| Governance consistency | one-decision gate | `PENDING_EXECUTION` | `EV-W8-307`,`EV-W8-402` | `PENDING` | docs sync pending |

## Rehearsal outcome

- Current status: `PENDING_DECISION`.
- Final verdict: `PENDING_DECISION` cho đến khi baseline và scenario matrix có evidence thật.
- Rule capture: không dùng placeholder ở mục đã chạy; phải ghi `actual` + trạng thái evidence tương ứng.
