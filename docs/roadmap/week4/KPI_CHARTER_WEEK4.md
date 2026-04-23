# KPI Charter Week 4 (Integration Stabilization)

## Mục tiêu

Định nghĩa KPI để đảm bảo W04 chốt được ổn định tích hợp runtime mà không phát sinh rối loạn diện rộng.

## KPI board

| Nhóm | KPI | Formula | Ngưỡng | Actual | Status | Evidence ID |
|---|---|---|---|---|---|---|
| Reliability | Critical Path Smoke Pass Rate | `passed_runs / total` | `< 0.95` | `1.0` | `GREEN` | `EV-W4-101..105` |
| Reliability | P0 Open Count | `count(P0 != DONE)` | `> 0` | `0` | `GREEN` | `W4-ISS-002,005` |
| Reliability | Rollback Recovery Time | `min to restore` | `> 5` | `0.0006s` | `GREEN` | `EV-W4-302` |
| Integration | Handshake Success | `success / total` | `< 1.0` | `1.0` | `GREEN` | `EV-W4-201` |
| Integration | Reconnect Success Rate | `success / total` | `< 1.0` | `1.0` | `GREEN` | `EV-W4-301` |
| Integration | Queue Stall Incidents | `count(stall)` | `> 0` | `0` | `GREEN` | `EV-W4-105` |
| Observability | Correlation Continuity | `count / total` | `< 1.0` | `1.0` | `GREEN` | `EV-W4-205`,`EV-W4-304` |
| Observability | Structured Error Coverage| `count / total` | `< 1.0` | `1.0` | `GREEN` | `EV-W4-303` |
| Observability | Correlation Audit | `findings` | `> 0` | `0` | `GREEN` | `EV-W4-107` |
| Engineering | Build/Static Check Profile | `success / total` | `< 1.0` | `1.0` | `GREEN` | `EV-W4-103`,`EV-W4-104` |
| Governance | Artifact Consistency | `consistent / total` | `< 1.0` | `1.0` | `GREEN` | `EV-W4-206` |

---
Last updated: 2026-04-23 (W4 Closeout)
