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
| P0 closure | all P0 `DONE` | `NEW` | `EV-W3-301` | `NO` | P0 chưa đóng |
| Baseline matrix | all required scenarios `CAPTURED_PASS` | `PENDING_EXECUTION` | `EV-W3-201..210` | `NO` | chưa capture đủ |
| Extreme negative tests | malformed JSON + invalid UTF-8 no-panic | `PENDING_EXECUTION` | `EV-W3-206`,`EV-W3-207` | `NO` | chưa chạy |
| Fuzzing hardening (`W3-T19`) | no panic + structured reject | `PENDING_EXECUTION` | `EV-W3-211` | `NO` | chưa chạy |
| Shadow log audit (`W3-T20`) | 5 trace chains liên tục | `PENDING_EXECUTION` | `EV-W3-212` | `NO` | chưa capture |
| Playbook sync (`W3-T21`) | class/type map cập nhật đúng | `PENDING_EXECUTION` | `EV-W3-213` | `NO` | chưa review |
| Network disconnect simulation (`W3-T22`) | reconnect pass, pipeline không treo | `PENDING_EXECUTION` | `EV-W3-214` | `NO` | chưa chạy |
| Performance watermark (`W3-T23`) | Signal->Ack E2E metrics captured | `PENDING_EXECUTION` | `EV-W3-218..220` | `NO` | chưa capture |
| Compliance auto-gate | correlation + versioning checks pass | `PENDING_EXECUTION` | `EV-W3-106` | `NO` | script chưa chạy |
| Correlation source audit | `0 findings` | `PENDING_EXECUTION` | `EV-W3-107` | `NO` | chưa chạy |
| Policy drift closeout | `W3-ISS-009` `DONE` | `NEW` | `EV-W3-104` | `NO` | chưa sync xong |
| Artifact consistency | issue/gate/final nhất quán | `PENDING_EXECUTION` | `EV-W3-302` | `NO` | chờ freeze cuối |
| Rollback rehearsal | rollback drill success < 5 phút | `PENDING_EXECUTION` | `EV-W3-5xx` | `NO` | chưa chạy drill |

## Rehearsal outcome
- Current status: `NO-GO`.
- Blockers: `W3-ISS-001`,`W3-ISS-002`,`W3-ISS-003`,`W3-ISS-009`,`W3-ISS-010`,`W3-ISS-011`,`W3-ISS-012`,`W3-ISS-013`,`W3-ISS-014`.

---
Last updated: W03 no-date mode sync
