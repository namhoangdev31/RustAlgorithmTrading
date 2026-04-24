# KPI Charter Week 9 (Observability Contract)

## Purpose

Khóa KPI vận hành cho W09 để đo độ đầy đủ của observability contract, correlation continuity, structured schema, redaction, dashboard/API data availability và alert readiness trước khi mở W10 API Health & SLO.

## KPI matrix

| KPI | Target | Actual | Status | Evidence ID | Owner |
|---|---|---|---|---|---|
| Compile/static/lint/type profile | `100% pass` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-101..106` | `tester` |
| Critical path smoke pass rate | `>=95%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-102`,`EV-W9-103` | `tester` |
| Correlation coverage critical events | `>=99%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-201`,`EV-W9-301` | `ops` |
| Critical missing correlation count | `0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-202` | `ops` |
| Schema/version coverage | `>=99%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-203` | `coder` |
| Structured log parse success | `>=99%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-204` | `coder` |
| Severity taxonomy coverage | `100%` critical event types | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-205` | `planner` |
| Reason/disposition taxonomy coverage | `100%` critical risk/execution events | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-206` | `planner` |
| Redaction leak count | `0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-207`,`EV-W9-302` | `ops` |
| Dashboard critical panel availability | `>=95%` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-208`,`EV-W9-303` | `ops` |
| Alert false-positive sample | `<=15%` if sample exists | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-209` | `ops` |
| Alert false-negative critical | `0` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-210` | `ops` |
| W05-W08 regression guard | `100% pass` required slices | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-211..214` | `tester` |
| Observability overhead | no critical regression | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-304` | `ops` |
| Change budget compliance | `<=18 files`, `<=900 LOC net` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-401` | `planner` |
| Artifact consistency | one final decision | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W9-402` | `planner` |

## KPI interpretation

- `GREEN`: target met with valid evidence ID.
- `YELLOW`: target partially met or pending rerun, no open P0.
- `RED`: target failed, P0 open, P1 unowned, or evidence missing for mandatory gate item.

## Gate KPI minimum

W09 chỉ được `GO` khi:

1. Tất cả KPI mandatory ở trạng thái `GREEN`.
2. Không còn P0 open.
3. Không có P1 unowned.
4. Không còn `CAPTURED_FAIL/BLOCKED_ENV` ở matrix bắt buộc.
5. Baseline, issue register, gate notes và final report cùng một quyết định cuối.
