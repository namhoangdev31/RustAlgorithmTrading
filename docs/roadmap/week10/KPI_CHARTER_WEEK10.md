# KPI Charter Week 10 (API Health & SLO)

## Purpose

Khóa KPI vận hành cho W10 để đo API health, readiness/liveness correctness, WebSocket heartbeat, SLO latency, alert quality và dashboard SLO availability trước khi mở W11 Incident Runbook.

## KPI matrix

| KPI | Target | Actual | Status | Evidence ID | Owner |
|---|---|---|---|---|---|
| Compile/static/lint/type profile | `100% pass` | `command profile fail due EV-W10-102` | `CAPTURED_FAIL` | `EV-W10-101..107` | `tester` |
| Critical path smoke pass rate | `>=95%` | `2/2 slices pass` | `CAPTURED_PASS` | `EV-W10-103`,`EV-W10-104` | `tester` |
| `/health` p95 latency | `<=100ms` local/test profile | `p95=0.96ms` | `CAPTURED_PASS` | `EV-W10-201` | `ops` |
| `/health/ready` correctness | `100%` scenarios | `contract checks pass` | `CAPTURED_PASS` | `EV-W10-202` | `tester` |
| `/health/live` correctness | `100%` scenarios | `contract checks pass` | `CAPTURED_PASS` | `EV-W10-203` | `tester` |
| `/api/system/health` p95 latency | `<=250ms` local/test profile | `p95=0.61ms` | `CAPTURED_PASS` | `EV-W10-204` | `ops` |
| Component health completeness | `100%` required components mapped | `execution/market_data/strategy/system/websocket present` | `CAPTURED_PASS` | `EV-W10-205` | `ops` |
| WebSocket heartbeat success | `>=99%` sample | `stream instability; 1012 restart seen` | `CAPTURED_FAIL` | `EV-W10-206` | `tester` |
| Event-to-alert latency | `<=120s` temporary W10 target | `no deterministic replay capture` | `BLOCKED_ENV` | `EV-W10-207` | `ops` |
| Alert false-positive sample | `<=15%` | `no labeled sample` | `BLOCKED_ENV` | `EV-W10-208` | `ops` |
| Alert false-negative critical | `0` | `no critical replay sample` | `BLOCKED_ENV` | `EV-W10-209` | `ops` |
| Alert acknowledgement success | `100%` sample | `200 acknowledged` | `CAPTURED_PASS` | `EV-W10-210` | `ops` |
| Dashboard SLO panel availability | `>=95%` | `no dashboard runtime probe in this run` | `BLOCKED_ENV` | `EV-W10-211` | `ops` |
| Correlation coverage | `>=99%` critical events | `audit pass but coverage denominator missing` | `BLOCKED_ENV` | `EV-W10-108`,`EV-W10-212` | `ops` |
| W05-W09 regression guard | `100% pass` required slices | `guardrail slices pass` | `CAPTURED_PASS` | `EV-W10-213..217` | `tester` |
| Change budget compliance | `<=18 files`, `<=900 LOC net` | `within budget` | `CAPTURED_PASS` | `EV-W10-401` | `planner` |
| Artifact consistency | one final decision | `all gate artifacts = NO-GO` | `CAPTURED_PASS` | `EV-W10-402` | `planner` |

## KPI interpretation

- `GREEN`: target met with valid evidence ID.
- `YELLOW`: target partially met or pending rerun, no open P0.
- `RED`: target failed, P0 open, P1 unowned, or evidence missing for mandatory gate item.

## Gate KPI minimum

W10 chỉ được `GO` khi:

1. Tất cả KPI mandatory ở trạng thái `GREEN`.
2. Không còn P0 open.
3. Không có P1 unowned.
4. Không còn `CAPTURED_FAIL/BLOCKED_ENV` ở matrix bắt buộc.
5. Baseline, issue register, gate notes và final report cùng một quyết định cuối.

### Current outcome

- Current KPI color: `RED`.
- Current gate verdict: `NO-GO`.
