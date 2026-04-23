# Stabilization Plan (Week 4 Integration)

## Mục tiêu

Ổn định tích hợp runtime sau W03 theo hướng thay đổi tối thiểu, giữ codebase hiện có và tăng khả năng vận hành.

## Dependency matrix

| Lane | Scope | Dependency | Merge condition |
|---|---|---|---|
| Lane 1 | Critical path handshake (Signal -> Risk -> Execution) | None | Smoke critical path `>= 95%` |
| Lane 2 | Resilience (reconnect, rollback, drop-safe) | Lane 1 | Reconnect + rollback rehearsal `CAPTURED_PASS` |
| Lane 3 | Observability and governance sync | Lane 1 + Lane 2 | Correlation audit `0 findings` + artifact consistency pass |

## Triage cluster mapping

| Cluster | Định nghĩa | Severity mặc định | Gate impact |
|---|---|---|---|
| A - Incompatibility | Không handshake hoặc crash/stall ở runtime path | P0 | blocking |
| B - Semantic Drift | Parse được nhưng sai nghĩa nghiệp vụ | P1 | blocking nếu ảnh hưởng critical decisions |
| C - Observability Gap | Chạy được nhưng thiếu dấu vết triage | P1/P2 | blocking nếu che mờ root cause |

## Snapshot & rollback strategy

1. Tạo snapshot baseline trước mọi thay đổi hardening W04.
2. Rollback trigger chung: nếu lỗi cùng loại lặp liên tục trong 5 phút ở critical path.
3. Rollback action: khôi phục cấu hình/runtime baseline đã freeze và rerun smoke profile.
4. Exit rollback: command profile tối thiểu đạt trạng thái `CAPTURED_PASS`.

## Rollback trigger/action per lane

| Lane | Trigger | Detection window | Rollback action | Success criteria |
|---|---|---|---|---|
| Lane 1 | Smoke rate < 95% hoặc handshake fail liên tục | 5 phút | rollback patch lane 1, restore baseline parser/bridge | smoke trở lại >= 95% |
| Lane 2 | reconnect fail hoặc rollback > 5 phút | 5 phút | bật rollback mode, restore resilience config trước thay đổi | reconnect + rollback rehearsal pass |
| Lane 3 | correlation audit findings > 0 hoặc artifact mâu thuẫn | 1 chu kỳ gate | rollback thay đổi logging/governance mới nhất | audit = 0, gate consistency pass |

## Cutover-to-stabilization steps

1. Freeze phạm vi W04 và import backlog carry-over.
2. Capture baseline clean-slate + command profile.
3. Thực thi Lane 1 -> Lane 2 -> Lane 3 theo dependency.
4. Cập nhật issue register theo evidence thật.
5. Gate rehearsal và chốt một trạng thái duy nhất.

## Lane outcomes (captured)

| Lane | Outcome | Evidence | Notes |
|---|---|---|---|
| Lane 1 (critical path) | `CAPTURED_PASS` | `EV-W4-201`, `EV-W4-101..105` | Smoke profile đạt 100%, không ghi nhận stall trên critical path. |
| Lane 2 (resilience) | `CAPTURED_PASS` | `EV-W4-202`, `EV-W4-203`, `EV-W4-204`, `EV-W4-301..303` | Reconnect/rollback/drop-safe pass; reconnect drill yêu cầu `PYTHONPATH=src:.`. |
| Lane 3 (observability + governance) | `CAPTURED_PASS` | `EV-W4-205`, `EV-W4-206`, `EV-W4-304` | 5 correlation IDs có full 4-hop chain; artifact gate nhất quán trạng thái GO. |

## Change-budget control

- Budget mặc định W04: `<=12 files`, `<=600 LOC net`.
- Khi vượt budget: bắt buộc mở escalation record có owner/mitigation/evidence.
- Không được đổi interface public nếu chưa có `CR-W04-###` hợp lệ.

---
Last updated: 2026-04-23 (W4 Closeout)
