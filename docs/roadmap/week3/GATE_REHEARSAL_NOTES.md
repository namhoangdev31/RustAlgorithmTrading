# Gate Rehearsal Notes - Week 3 (Schema Versioning)

## Gate rule chuẩn
- Gate mặc định: `NO-GO có điều kiện`.
- Chỉ set `GO` khi:
  1. Không còn P0 ở `NEW/IN_PROGRESS/BLOCKED`.
  2. `W3-ISS-009` = `DONE`.
  3. Toàn bộ scenario bắt buộc có `CAPTURED_PASS`.

## Checklist rehearsal

| Gate item | Expected | Current status | Evidence ID | Verdict | Notes |
|---|---|---|---|---|---|
| V1 envelope freeze | contract + parser behavior đã khóa | `PENDING_EXECUTION` | `EV-W3-201` | `NO` | chờ capture parser evidence |
| Baseline schema tests | matrix đầy đủ, không thiếu scenario | `PENDING_EXECUTION` | `EV-W3-201..209` | `NO` | hiện chưa capture |
| P0 ownership + progress | không P0 unowned, có ETA/evidence | `PARTIAL` | `EV-W3-301` | `NO` | mới có owner, chưa có capture done |
| Migration `v0 -> v1` | compatibility + rollback rules hoạt động | `PENDING_EXECUTION` | `EV-W3-401` | `NO` | chờ validation lane dependencies |
| Policy drift `W3-ISS-009` | phải `DONE` | `NEW` | `EV-W3-104` | `NO` | chưa đóng issue policy drift |

## Rehearsal outcome
- Current status: `NO-GO có điều kiện`.
- Blocking issues: `W3-ISS-001`, `W3-ISS-002`, `W3-ISS-003`, `W3-ISS-009`.
- Next required action: hoàn tất evidence capture theo baseline report trước khi rerun gate.

---
Last updated: 2026-04-23
