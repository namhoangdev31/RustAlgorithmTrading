# Kế Hoạch Vận Hành Tuần 4 (W04, Integration Stabilization)

## 1) Mục tiêu tuần

W04 tập trung ổn định tích hợp sau cutover contract:

1. Ổn định critical path `signal -> risk -> execution` ở trạng thái vận hành nhất quán.
2. Đóng các gap còn lại về resilience (rollback/reconnect/drop-safe) mà không mở refactor lớn.
3. Đồng bộ governance/evidence để chốt một quyết định gate duy nhất cho W04.
4. Chuẩn bị start pack W05 (Risk Limits v1) với backlog ưu tiên rõ ràng.

Ràng buộc W04:

- Giữ contract đã freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Không mở thêm interface/type mới nếu không có trigger rủi ro P0/P1 và Change Record hợp lệ.
- Ưu tiên tối đa giữ codebase hiện hữu (hardening + adapter + triage có kiểm soát).

## 1.1) Thay đổi & Ngưỡng (Change Budget & Thresholds)

| Chỉ số | Ngưỡng bắt buộc (W04) | Actual | Status |
|---|---|---|---|
| Change Budget | `<= 12 files` | `Within budget (no refactor lan rộng)` | `PASS` |
| Compile/Static/Lint/Type | `100% pass` | `Build + static check profile PASS` | `PASS` |
| Smoke critical path | `>= 95% pass` | `100%` | `PASS` |
| P0/P1 governance | P0 open `= 0` | `0` | `PASS` |

---

## 2) Task board theo chu kỳ (W4-T01 -> W4-T18)

### Pha 1: Freeze phạm vi ổn định tích hợp
- `W4-T01` `DONE`
- `W4-T02` `DONE`
- `W4-T03` `DONE`

### Pha 2: Baseline capture
- `W4-T04` `DONE`
- `W4-T05` `DONE`
- `W4-T06` `DONE`

### Pha 3: Resilience hardening
- `W4-T07` `DONE`
- `W4-T08` `DONE`
- `W4-T09` `DONE`

### Pha 4: Observability + triage
- `W4-T10` `DONE`
- `W4-T11` `DONE`
- `W4-T12` `DONE`

### Pha 5: Closure + rerun
- `W4-T13` `DONE`
- `W4-T14` `DONE`

### Pha 6: Gate rehearsal
- `W4-T15` `DONE`
- `W4-T16` `DONE`

### Pha 7: Final closeout
- `W4-T17` `DONE`
- `W4-T18` `DONE`

---

## 3) Decision log
- Trạng thái cuối cùng: **GO**.
- Sẵn sàng bước sang Week 5.

---
Last updated: 2026-04-23 (W4 Closeout)
