# Issue Register Week 18 (Canary Design)

## 1) P0 Blocker (Must close for GO)

| ID | Issue | Impact | Status | Owner | Evidence |
|---|---|---|---|---|---|
| `W18-ISS-001` | Canary scenario coverage thiếu mandatory items | Canary launch risk cao | `NEW` | `tester` | `EV-W18-201` |
| `W18-ISS-002` | Rollback rehearsal fail | Không đảm bảo recoverability | `NEW` | `coder` | `EV-W18-202` |
| `W18-ISS-003` | Canary breach handling không deterministic | Safety path không tin cậy | `NEW` | `ops` | `EV-W18-203` |

## 2) P1 Critical (Owner + ETA required for GO)

| ID | Issue | Impact | Status | Owner | ETA |
|---|---|---|---|---|---|
| `W18-ISS-004` | Kill-switch response vượt ngưỡng | Delay risk-off action | `NEW` | `ops` | `Pha 4` |
| `W18-ISS-005` | Risk boundary definition drift | Canary acceptance mơ hồ | `NEW` | `planner` | `Pha 4` |
| `W18-ISS-006` | Fault-injection scenario chưa phủ đủ | Hidden failure modes | `NEW` | `tester` | `Pha 4` |
| `W18-ISS-007` | W09-W17 regression chưa rerun sau hardening | Regression risk tích lũy | `NEW` | `tester` | `Pha 5` |
| `W18-ISS-008` | Gate artifacts mâu thuẫn trạng thái | Governance fail | `NEW` | `planner` | `Pha 6` |
| `W18-ISS-009` | Week 19 handoff thiếu safety priorities | W19 kickoff mơ hồ | `NEW` | `planner` | `Pha 7` |
| `W18-ISS-010` | Change budget vượt ngưỡng không escalation | Tăng regression risk | `NEW` | `planner` | `Pha 5` |

## 3) P2 Normal (Monitor)

| ID | Issue | Impact | Status | Owner |
|---|---|---|---|---|
| `W18-ISS-011` | Canary toil/throughput chưa đo | Ops capacity khó dự báo | `NEW` | `ops` |
| `W18-ISS-012` | Evidence linkage thiếu canary->rollback->gate | Audit chậm | `NEW` | `planner` |
