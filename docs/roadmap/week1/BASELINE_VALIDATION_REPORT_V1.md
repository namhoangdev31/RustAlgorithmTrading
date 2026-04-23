# Baseline Validation Report v1 (W01)

## Window
- W01 baseline snapshot (pre-gate run)

## Command Evidence

### 1) Python unit collection baseline
```bash
python -m pytest tests/unit/python/test_strategy_base.py -q --maxfail=1
```
Observed:
- Status: `PASSED`
- Mapping issue: `W1-ISS-001`

### 2) Rust workspace check baseline
```bash
cd rust && cargo check --workspace
```
Observed:
- Status: `PASSED` (compat flag khi cần)
- Mapping issue: `W1-ISS-006`

### 3) Rust workspace test baseline
```bash
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test --workspace -- --nocapture
```
Observed:
- Status: `PASSED`
- Mapping issue: `W1-ISS-008`

### 4) Health/observability baseline
```bash
bash scripts/health_check.sh
```
Observed:
- Status: `PASSED`
- Mapping issue: `W1-ISS-009`

## Baseline Matrix Summary

| Group | Command set | Status | Notes |
|---|---|---|---|
| Python Unit | pytest critical unit file | PASSED | baseline captured |
| Rust Build | cargo check workspace | PASSED | compat path documented |
| Rust Test | cargo test workspace | PASSED | crates pass in baseline |
| Observability Smoke | health_check script | PASSED | core services reachable |
| Integration Smoke | signal->risk->execution | PASSED | smoke evidence captured |

## Decision
- W01 baseline đạt trạng thái `GREEN` cho gate khởi động W02.

---
Last updated: W01 no-date mode sync
