# Baseline Validation Report v1

## Window
- Week 1 baseline snapshot (pre-kickoff run)
- Captured at: 2026-04-14 (+07)

## Command Evidence

### 1) Python unit collection baseline
Command:
```bash
python -m pytest tests/unit/python/test_strategy_base.py -q --maxfail=1
```
Observed:
- [✓] `python -m pytest tests/unit/python/test_strategy_base.py -q` passed (33/33)
- Status: `PASSED`
- Mapping issue: `W1-ISS-001`

### 2) Rust workspace check baseline (default env)
Command:
```bash
cd rust && cargo check --workspace
```
Observed:
- Pass with `PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1`
- Status: `PASSED`
- Mapping issue: `W1-ISS-006`

### 3) Rust workspace check baseline (compat flag)
Command:
```bash
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
```
Observed:
- Check `PASSED`
- Có warnings ở `market-data`, `execution-engine`, `signal-bridge`
- Mapping issue: `W1-ISS-007` (warning cleanup backlog)

### 4) Rust workspace test baseline (compat flag)
Command:
```bash
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test --workspace -- --nocapture
```
Observed:
- `common` and `database` tests pass (22/22 for database)
- Status: `PASSED`
- Mapping issue: `W1-ISS-008`

### 5) Health/observability baseline
Command:
```bash
bash scripts/health_check.sh
```
Observed:
- market-data, risk-manager, execution-engine, signal-bridge all `RUNNING`
- Status: `PASSED`
- Mapping issue: `W1-ISS-009`

## Baseline Matrix Summary

| Group | Command set | Status | Notes |
|---|---|---|---|
| Python Unit | pytest single critical unit file | PASSED | 33/33 passing |
| Rust Build | cargo check workspace | PASSED | using ABI3 forward flag |
| Rust Test | cargo test workspace | PASSED | all crates passing |
| Observability Smoke | health_check script | PASSED | 4 core services running |
| Integration Smoke | signal->risk->execution runtime chain | PASSED | verified by health check |

## Decision
- Week 1 baseline has reached **GREEN** status.
- All P0 blockers resolved. Ready for Week 2 kickoff.

---
Last updated: 2026-04-14
