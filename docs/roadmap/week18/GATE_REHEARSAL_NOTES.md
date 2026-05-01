# Gate Rehearsal Notes W18 - Canary Design

## 1) Gate status

- Current gate status: `PENDING_DECISION`.
- Final verdict: `PENDING_DECISION`.
- Gate rule: W18 chỉ `GO` khi canary/rollback mandatory criteria đạt ngưỡng, regression guard pass và artifacts không mâu thuẫn.

## 2) Mandatory gate checklist

| Gate item | Target | Evidence ID | Current status | Notes |
|---|---|---|---|---|
| Canary scenario coverage | `100%` mandatory scenarios | `EV-W18-201` | `PENDING_EXECUTION` | scenario matrix |
| Rollback rehearsal | success `100%` | `EV-W18-202` | `PENDING_EXECUTION` | required drills |
| Breach handling determinism | pass required drills | `EV-W18-203` | `PENDING_EXECUTION` | deterministic outcomes |
| Kill-switch response | `<=60s` | `EV-W18-204` | `PENDING_EXECUTION` | latency capture |
| Risk boundary integrity | unmitigated breach `=0` | `EV-W18-205` | `PENDING_EXECUTION` | boundary checks |
| Fault-injection coverage | `100%` required scenarios | `EV-W18-206` | `PENDING_EXECUTION` | scenario coverage |
| Correlation coverage | `>=99%` | `EV-W18-207` | `PENDING_EXECUTION` | critical event coverage |
| Compliance findings | `0` | `EV-W18-208` | `PENDING_EXECUTION` | compliance output |
| W09-W17 regression guard | `100%` pass | `EV-W18-301..306` | `PENDING_EXECUTION` | guardrails |
| Artifact consistency | one final verdict | `EV-W18-401`,`EV-W18-402` | `PENDING_EXECUTION` | reconciliation |

## 3) Rehearsal flow

1. Run command profile và capture baseline evidence.
2. Run canary scenario + rollback rehearsals.
3. Run breach handling and fault-injection checks.
4. Rerun baseline sau hardening.
5. Reconcile artifacts theo thứ tự cố định.
6. Lock final verdict.
