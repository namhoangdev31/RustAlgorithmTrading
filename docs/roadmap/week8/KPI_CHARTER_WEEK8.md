# KPI Charter Week 8 (Execution Retry/Slippage)

## Purpose

Khóa KPI vận hành cho W08 để đo độ an toàn retry, duplicate-order prevention, slippage guardrails, tương tác với W05/W06/W07 và evidence trước khi mở W09 Observability Contract.

## KPI matrix

| KPI | Target | Actual | Status | Evidence ID | Owner |
|---|---|---|---|---|---|
| Compile/static/lint/type profile | `100% pass` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-101..104` | `tester` |
| Critical path smoke pass rate | `>=95%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-101`,`EV-W8-102` | `tester` |
| Retry classification coverage | `100%` mandatory classifications | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-201..205` | `coder` |
| Retry attempt bound correctness | no over-attempt | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-202`,`EV-W8-206` | `tester` |
| Duplicate order rate | `<=0.1%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-207`,`EV-W8-302` | `tester` |
| Client order id stability | `100%` stable per logical order | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-208` | `tester` |
| Risk-off bypass count | `0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-209`,`EV-W8-304` | `tester` |
| Slippage boundary coverage | `100%` mandatory boundary cases | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-210..214` | `tester` |
| Slippage breach route count | `0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-212`,`EV-W8-303` | `coder` |
| W05/W06/W07 regression guard | `100% pass` required slices | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-215..217` | `tester` |
| Execution correlation continuity | `100%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-106`,`EV-W8-107`,`EV-W8-304` | `ops` |
| Metrics scrape completeness | retry/slippage metrics present if added | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-305` | `ops` |
| Retry/slippage latency overhead | no critical regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-306` | `ops` |
| Change budget compliance | `<=15 files`, `<=800 LOC net` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-401` | `planner` |
| Artifact consistency | one final decision | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W8-402` | `planner` |

## KPI interpretation

- `GREEN`: target met with valid evidence ID.
- `YELLOW`: target partially met or pending rerun, no open P0.
- `RED`: target failed, P0 open, P1 unowned, or evidence missing for mandatory gate item.

## Gate KPI minimum

W08 chỉ được `GO` khi:

1. Tất cả KPI mandatory ở trạng thái `GREEN`.
2. Không còn P0 open.
3. Không có P1 unowned.
4. Không còn `CAPTURED_FAIL/BLOCKED_ENV` ở matrix bắt buộc.
5. Baseline, issue register, gate notes và final report cùng một quyết định cuối.
