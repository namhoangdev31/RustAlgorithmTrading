# KPI Charter W18 - Canary Design

## 1) Charter scope

W18 đo lường độ hoàn thiện của Canary Design, tính deterministic trong xử lý breach, kill-switch SLA, và risk boundary integrity trước khi tiến vào giai đoạn W19.

## 2) KPI table

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| Canary scenario coverage | `100%` mandatory scenarios | covered scenarios / required scenarios | `100%` | `CAPTURED_PASS` | `EV-W18-201` | `tester` |
| Rollback rehearsal success | `100%` | successful rollback drills / required drills | `100.0%` | `CAPTURED_PASS` | `EV-W18-202` | `tester` |
| Breach handling determinism | `PASS` | deterministic response | `PASS` | `CAPTURED_PASS` | `EV-W18-203` | `coder` |
| Kill-switch latency | `<=60s` | max response latency | `42.50s` | `CAPTURED_PASS` | `EV-W18-204` | `ops` |
| Risk boundary integrity | unmitigated breach `=0` | unmitigated breaches count | `0` | `CAPTURED_PASS` | `EV-W18-205` | `planner` |
| Fault-injection coverage | `100%` required channels | tested channels / required channels | `100%` | `CAPTURED_PASS` | `EV-W18-206` | `tester` |
| Correlation coverage | `>=99%` | critical event sample coverage | `99.8%` | `CAPTURED_PASS` | `EV-W18-207` | `tester` |
| Compliance findings | `0` | findings count | `0` | `CAPTURED_PASS` | `EV-W18-208` | `tester` |
| Throughput watermark | captured | watermark recorded | `5000 msgs/sec` | `CAPTURED_PASS` | `EV-W18-209` | `ops` |
| W09-W17 regression guard | `100%` | required slices pass | `100%` | `CAPTURED_PASS` | `EV-W18-301..306` | `tester` |
| Artifact consistency | `100%` | baseline/issue/KPI/gate/final same verdict | `100%` | `CAPTURED_PASS` | `EV-W18-401..402` | `planner` |

## 3) KPI rules

- `CAPTURED_PASS` chỉ hợp lệ khi `actual` có dữ liệu numeric hoặc output command tương ứng.
- `BLOCKED_ENV` bắt buộc có blocker, owner, ETA và điều kiện rerun.
- KPI mandatory fail/block thì verdict mặc định `NO-GO`.
