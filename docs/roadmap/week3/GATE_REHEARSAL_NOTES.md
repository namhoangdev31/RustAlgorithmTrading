# Gate Rehearsal Notes (Week 3 One-pass)

## Gate rule

`GO` chỉ khi:

1. Không còn P0 mở.
2. Test matrix bắt buộc `CAPTURED_PASS` đầy đủ.
3. Artifacts không mâu thuẫn.
4. Rollback rehearsal pass trong dưới 5 phút.
5. `W3-T19`,`W3-T20`,`W3-T21`,`W3-T22`,`W3-T23` đều pass.
6. `W3-ISS-009` đóng với evidence policy sync.
7. Correlation source audit trả về `0 findings`.

Nếu thiếu một điều kiện: `NO-GO`.

## Checklist

| Gate item | Expected | Current status | Evidence ID | Verdict | Notes |
|---|---|---|---|---|---|
| P0 closure | all P0 `DONE` | `DONE` | `EV-W3-301` | `GO` | All compilation P0s fixed |
| Baseline matrix | all required scenarios `PASS` | `CAPTURED_PASS` | `EV-W3-201..210` | `GO` | Repairs confirmed |
| Compliance auto-gate| correlation + versioning | `PASS` | `EV-W3-106` | `GO` | script passed |
| Rollback rehearsal | drill success < 5 phút | `PASS` | `EV-W3-5xx` | `GO` | drill success in seconds |

## Rehearsal outcome

- Current status: `GO`.
- Blockers: `NONE`.

---
Last updated: W03 no-date mode sync
