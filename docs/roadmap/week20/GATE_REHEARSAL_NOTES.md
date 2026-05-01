# Gate Rehearsal Notes W20 - Canary Launch (Hẹp)

## 1) Gate status

- Current gate status: `PENDING_DECISION`.
- Final verdict: `PENDING_DECISION`.
- Gate rule: W20 chỉ `GO` khi controlled canary launch mandatory criteria đạt ngưỡng, regression guard pass và artifacts không mâu thuẫn.

## 2) Mandatory gate checklist

| Gate item | Target | Evidence ID | Current status | Notes |
|---|---|---|---|---|
| Controlled launch coverage | `100%` mandatory scenarios | `EV-W20-201` | `PENDING_EXECUTION` | launch matrix |
| Risk boundary integrity | unmitigated breach `=0` | `EV-W20-202` | `PENDING_EXECUTION` | boundary checks |
| Kill-switch response | `<=60s` | `EV-W20-203` | `PENDING_EXECUTION` | latency capture |
| Rollback rehearsal | success `100%` | `EV-W20-204` | `PENDING_EXECUTION` | required drills |
| Escalation correctness | mandatory scenarios pass | `EV-W20-205` | `PENDING_EXECUTION` | escalation flow |
| Fault-injection coverage | `100%` required scenarios | `EV-W20-206` | `PENDING_EXECUTION` | required drills |
| Correlation coverage | `>=99%` | `EV-W20-207` | `PENDING_EXECUTION` | critical event coverage |
| Compliance findings | `0` | `EV-W20-208` | `PENDING_EXECUTION` | compliance output |
| W09-W19 regression guard | `100%` pass | `EV-W20-301..306` | `PENDING_EXECUTION` | guardrails |
| Artifact consistency | one final verdict | `EV-W20-401`,`EV-W20-402` | `PENDING_EXECUTION` | reconciliation |

## 3) Rehearsal flow

1. Run command profile và capture baseline evidence.
2. Run controlled launch + boundary rehearsals.
3. Run kill-switch/rollback and escalation checks.
4. Rerun baseline sau hardening.
5. Reconcile artifacts theo thứ tự cố định.
6. Lock final verdict.
