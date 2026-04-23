# Gate Rehearsal Notes (Week 5 Risk Limits v1)

## Gate rule

`GO` chỉ khi đồng thời:

1. Compile/static/lint/type `100% pass`.
2. Smoke critical path `>=95%`.
3. Duplicate order rate trên reject path `<=0.1%`.
4. Patch-induced risk breaches `= 0`.
5. BVA coverage `limit-1/limit/limit+1` cho symbol + strategy `=100%`.
6. Enum canonicalization (`Decision`, `ReasonCode`) `=100%`.
7. Bridge fail-fast reject ratio `=100%`.
8. Risk lookup overhead `<=0.2ms` so với watermark W04.
9. Redaction compliance (`limit_snapshot` ở public logs) `=100%`.
10. Không còn P0 open, không có P1 unowned.
11. Correlation source audit trả `0 findings`.
12. Không còn `CAPTURED_FAIL/BLOCKED_ENV` ở matrix bắt buộc.
13. Baseline/Issue/Gate/Final report thống nhất 1 trạng thái cuối.

Nếu thiếu một điều kiện: `NO-GO`.

## Checklist

| Gate item | Expected | Current status | Evidence ID | Verdict | Notes |
|---|---|---|---|---|---|
| Build + static profile | `100% pass` | `CAPTURED_PASS` | `EV-W5-101..104` | `PASS` | Python + Rust command profile passed |
| Smoke critical path | `>=95%` | `CAPTURED_PASS` | `EV-W5-101`,`EV-W5-102` | `PASS` | smoke suites `9/9`, `8/8` passed |
| Duplicate order rate | `<=0.1%` | `CAPTURED_PASS` | `EV-W5-205`,`EV-W5-302` | `PASS` | duplicate reject path blocked in fail-fast tests |
| Patch-induced risk breaches | `=0` | `CAPTURED_PASS` | `EV-W5-103`,`EV-W5-105` | `PASS` | no breach surfaced in rerun + health profile |
| BVA coverage | `100%` | `CAPTURED_PASS` | `EV-W5-207`,`EV-W5-208` | `PASS` | symbol + strategy BVA pass/pass/reject complete |
| Enum canonicalization | `100%` | `CAPTURED_PASS` | `EV-W5-209` | `PASS` | canonical enum serialization validated |
| Bridge fail-fast reject ratio | `100%` | `CAPTURED_PASS` | `EV-W5-210`,`EV-W5-302` | `PASS` | REJECT disposition blocked before propagation |
| Risk lookup overhead | `<=0.2ms` | `CAPTURED_PASS` | `EV-W5-108`,`EV-W5-109`,`EV-W5-212` | `PASS` | guardrail test passed (`<=0.2ms`) |
| Redaction compliance | `100%` | `CAPTURED_PASS` | `EV-W5-211`,`EV-W5-305` | `PASS` | formatter redaction + compliance audit passed |
| P0/P1 governance | P0 open `=0`, P1 unowned `=0` | `CAPTURED_PASS` | `EV-W5-304` | `PASS` | all gate-blocking issues closed in register |
| Correlation audit | `0 findings` | `CAPTURED_PASS` | `EV-W5-107` | `PASS` | audit reported zero findings |
| Governance consistency | one-decision gate | `CAPTURED_PASS` | `EV-W5-206`,`EV-W5-304` | `PASS` | baseline/issue/gate/final reconciled to GO |

## Rehearsal outcome

- Current status: `GO`.
- Final verdict: `GO` (all mandatory gate items are `CAPTURED_PASS`).
- Rule capture: không dùng placeholder `PENDING_CAPTURE` ở mục đã chạy; phải ghi `actual` + trạng thái evidence tương ứng.

---
Last updated: 2026-04-23 (W05 gate rehearsal completed)
