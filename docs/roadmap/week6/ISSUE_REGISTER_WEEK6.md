# Issue Register Week 6 (Stop-loss Coherence)

## Board schema

- Flow: `NEW -> IN_PROGRESS -> BLOCKED -> DONE`
- Metadata bắt buộc: `issue_id`, `cluster`, `severity`, `owner`, `due`, `eta`, `status`, `dependency`, `mitigation`, `exit_criteria`, `evidence_id`, `blocking_of`
- Cluster chuẩn: `A-Incompatibility`, `B-SemanticDrift`, `C-ObservabilityGap`

## Closed issues

| Issue ID | Cluster | Severity | Owner | Due | ETA | Status | Dependency | Mitigation | Exit criteria | Evidence ID | Blocking of |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `W6-ISS-001` | A-Incompatibility | P0 | `coder` | Pha 3 | Done | `DONE` | stop semantics freeze | align Python/Rust stop scenarios through parity harness | parity matrix 100% | `EV-W6-201..208`,`EV-W6-301` | Gate |
| `W6-ISS-002` | A-Incompatibility | P0 | `tester` | Pha 4 | Done | `DONE` | execution stop path | deterministic stop order id + replay check | duplicate stop-order rate <=0.1% | `EV-W6-209`,`EV-W6-302` | Gate |
| `W6-ISS-003` | A-Incompatibility | P0 | `coder` | Pha 3 | Done | `DONE` | execution ack path | validate stop trigger -> execution suite -> health | stop ack/closure path pass | `EV-W6-105`,`EV-W6-107`,`EV-W6-210` | Gate |
| `W6-ISS-004` | B-SemanticDrift | P1 | `coder` | Pha 3 | Done | `DONE` | trailing stop policy | lock long/short monotonic trigger semantics | trailing scenarios pass | `EV-W6-203`,`EV-W6-204` | Gate |
| `W6-ISS-005` | B-SemanticDrift | P1 | `tester` | Pha 2 | Done | `DONE` | Python backtest behavior | preserve immediate stop-loss exit while take-profit still observes holding gate | immediate regression pass | `EV-W6-101`,`EV-W6-205` | Gate |
| `W6-ISS-006` | C-ObservabilityGap | P1 | `ops` | Pha 4 | Done | `DONE` | observability profile | verify stop/correlation context and source audit | correlation audit 0 findings + metadata complete | `EV-W6-108`,`EV-W6-109`,`EV-W6-212` | Gate |
| `W6-ISS-007` | B-SemanticDrift | P1 | `coder` | Pha 4 | Done | `DONE` | position state | cleanup stale stop state after `PositionClosed`/`quantity=0` and update LimitChecker | no stale trigger after close/reopen | `EV-W6-211`,`EV-W6-216`,`EV-W6-303`,`EV-W6-308` | Gate |
| `W6-ISS-008` | C-ObservabilityGap | P1 | `planner` | Pha 6 | Done | `DONE` | doc sync | sync baseline/issue/gate/final | one final decision | `EV-W6-304` | Gate |
| `W6-ISS-009` | B-SemanticDrift | P2 | `planner` | Pha 5 | Done with escalation | `DONE` | scope creep | record file-count escalation; keep LOC within budget | within budget or escalation record | `EV-W6-401` | Governance |
| `W6-ISS-010` | B-SemanticDrift | P2 | `ops` | Pha 5 | Done | `DONE` | perf watermark | use nearest risk overhead guard until dedicated W06 microbench exists | overhead guard pass or mitigation | `EV-W6-306` | KPI |
| `W6-ISS-011` | B-SemanticDrift | P1 | `coder` | Pha 4 | Done | `DONE` | W05 hot-reload | ensure reload affects new decisions only | reload interaction guard pass | `EV-W6-305` | Gate |
| `W6-ISS-012` | B-SemanticDrift | P1 | `tester` | Pha 2 | Done | `DONE` | numeric precision policy | freeze default tick tolerance `1e-8` and assert no drift | no Python/Rust drift beyond tolerance | `EV-W6-110`,`EV-W6-214` | Gate |
| `W6-ISS-013` | B-SemanticDrift | P1 | `tester` | Pha 4 | Done | `DONE` | parity harness | run `scripts/verify_parity_w6.py --fail-on-drift` | same price stream triggers same stop by `correlation_id` | `EV-W6-110`,`EV-W6-215`,`EV-W6-307` | Gate |

## Gate blockers

- [x] Không còn P0 open.
- [x] Không còn evidence `CAPTURED_FAIL/BLOCKED_ENV` trong matrix bắt buộc.
- [x] Không còn P1 unowned.
- [x] Gate artifacts thống nhất một trạng thái cuối: `GO`.

## Escalation record

| Record ID | Trigger | Decision | Evidence |
|---|---|---|---|
| `ESC-W6-001` | Change budget file-count vượt `<=15 files` | Accepted for W06 because parity helper, Rust helper, PLAYBOOK sync and gate artifact reconciliation are required to close P0/P1; LOC net remains below `<=800` threshold | `EV-W6-401` |
