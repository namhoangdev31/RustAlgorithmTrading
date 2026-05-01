# Gate Rehearsal Notes W17 - Staging Hardening

## 1) Gate status

- Current gate status: `PENDING_DECISION`.
- Final verdict: `PENDING_DECISION`.
- Gate rule: W17 chỉ `GO` khi soak/kill-switch/rollback đạt ngưỡng, regression guard pass và artifacts không mâu thuẫn.

## 2) Mandatory gate checklist

| Gate item | Target | Evidence ID | Current status | Notes |
|---|---|---|---|---|
| Soak stability | no new gate-blocking P0/P1 | `EV-W17-201` | `PENDING_EXECUTION` | required scenarios |
| Kill-switch response | `<=60s` | `EV-W17-202` | `PENDING_EXECUTION` | latency capture |
| Rollback rehearsal | success `100%` | `EV-W17-203` | `PENDING_EXECUTION` | rollback drills |
| Incident triage completeness | `100%` | `EV-W17-204` | `PENDING_EXECUTION` | owner/ETA/mitigation |
| Recovery consistency | `100%` required scenarios | `EV-W17-205` | `PENDING_EXECUTION` | deterministic outcome |
| Alert quality under soak | FP<=15%, FN critical=0 | `EV-W17-206` | `PENDING_EXECUTION` | sampled metrics |
| Fault-injection coverage | `100%` | `EV-W17-207` | `PENDING_EXECUTION` | required drills |
| Correlation coverage | `>=99%` | `EV-W17-208` | `PENDING_EXECUTION` | critical event coverage |
| Compliance findings | `0` | `EV-W17-209` | `PENDING_EXECUTION` | compliance output |
| W09-W16 regression guard | `100%` pass | `EV-W17-301..306` | `PENDING_EXECUTION` | guardrails |
| Artifact consistency | one final verdict | `EV-W17-401`,`EV-W17-402` | `PENDING_EXECUTION` | reconciliation |

## 3) Rehearsal flow

1. Run command profile và capture baseline evidence.
2. Run soak + kill-switch + rollback rehearsals.
3. Run fault-injection and recovery consistency rehearsals.
4. Rerun baseline sau hardening.
5. Reconcile artifacts theo thứ tự cố định.
6. Lock final verdict.
