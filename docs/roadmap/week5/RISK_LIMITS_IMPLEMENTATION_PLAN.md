# Risk Limits Implementation Plan (Week 5)

## Mục tiêu

Triển khai Risk Limits v1 theo hướng thay đổi tối thiểu, tập trung enforce policy và reject semantics nhất quán trên critical path.

## Dependency matrix

| Lane | Scope | Dependency | Merge condition |
|---|---|---|---|
| Lane 1 | Per-symbol/per-strategy limits enforcement + BVA | None | Limit compliance + BVA matrix `CAPTURED_PASS` |
| Lane 2 | Reject semantics + ack mapping + bridge fail-fast reject | Lane 1 | Reject payload completeness pass + no duplicate-order on reject |
| Lane 3 | Observability + governance sync | Lane 1 + Lane 2 | Correlation audit `0 findings` + artifact consistency pass |

## Triage cluster mapping

| Cluster | Định nghĩa | Severity mặc định | Gate impact |
|---|---|---|---|
| A - Incompatibility | Không enforce được limit hoặc gây crash/stall | P0 | blocking |
| B - Semantic Drift | Reject/allow sai policy hoặc thiếu metadata | P1 | blocking nếu ảnh hưởng risk decision |
| C - Observability Gap | Reject path thiếu correlation/log context | P1/P2 | blocking nếu che mờ root cause |

## Rollback strategy

1. Snapshot baseline trước rollout lane mới.
2. Trigger rollback: risk breach mới do patch > 0, hoặc duplicate order rate > 0.1%.
3. Rollback action: revert lane gần nhất, restore policy baseline, rerun command profile.
4. Exit rollback: command profile + risk matrix tối thiểu `CAPTURED_PASS`.
5. Trigger rollback hiệu năng: risk lookup overhead > 0.2ms so với watermark W04.

## Rollback trigger/action per lane

| Lane | Trigger | Detection window | Rollback action | Success criteria |
|---|---|---|---|---|
| Lane 1 | Limit checks sai hoặc bypass | 1 chu kỳ smoke | rollback policy patch lane 1 | symbol/strategy cap checks pass |
| Lane 2 | Reject semantics thiếu/không đồng bộ ack hoặc fail-fast reject không hoạt động | 1 chu kỳ smoke | rollback reject mapping patch lane 2 | reject payload completeness pass + duplicate order guardrail pass |
| Lane 3 | Correlation audit findings > 0 hoặc docs mâu thuẫn gate | 1 chu kỳ gate | rollback logging/governance patch mới nhất | audit = 0 + one-decision gate |
| Lane 3 | Public log lộ `limit_snapshot` chưa redaction | 1 chu kỳ gate | rollback logging formatter patch mới nhất | redaction compliance = 100% |

## Implementation steps

1. Freeze policy + acceptance criteria cho limits.
2. Capture baseline command profile.
3. Triển khai lane 1 -> lane 2 -> lane 3 theo dependency.
4. Triage mismatch và cập nhật issue register theo evidence.
5. Gate rehearsal, chốt một trạng thái cuối.

## Performance watermark guardrail

1. Benchmark độ trễ risk lookup tại baseline W05 trước rollout (`EV-W5-108`).
2. Benchmark lại sau rollout (`EV-W5-109`).
3. Chỉ chấp nhận `GO` khi overhead `<= 0.2ms` so với baseline W04.
4. Nếu vượt ngưỡng, ưu tiên mitigation cache state trong RAM và rerun benchmark.

## Change-budget control

- Budget W05: `<=15 files`, `<=800 LOC net`.
- Vượt budget phải mở escalation record có owner/mitigation/evidence.
- Không đổi interface public nếu chưa có `CR-W05-###`.

## Lane outcomes (captured)

| Lane | Outcome | Status | Evidence |
|---|---|---|---|
| Lane 1 | Symbol/strategy limits + BVA đạt yêu cầu | `DONE` | `EV-W5-201`,`EV-W5-202`,`EV-W5-207`,`EV-W5-208` |
| Lane 2 | Reject semantics + enum canonicalization + fail-fast reject hoàn tất | `DONE` | `EV-W5-203`,`EV-W5-209`,`EV-W5-210`,`EV-W5-302` |
| Lane 3 | Correlation audit + redaction + artifact reconciliation hoàn tất | `DONE` | `EV-W5-107`,`EV-W5-211`,`EV-W5-305`,`EV-W5-304` |

Budget check:

- `EV-W5-401`: `5 files`, `180 LOC net` -> within W05 threshold.

---
Last updated: 2026-04-23 (W05 implementation captured)
