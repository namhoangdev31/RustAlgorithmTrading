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
- `ERROR collecting ... ModuleNotFoundError: No module named 'pandas'`
- Status: `FAILED (environment dependency blocker)`
- Mapping issue: `W1-ISS-001`

### 2) Rust workspace check baseline (default env)
Command:
```bash
cd rust && cargo check --workspace
```
Observed:
- Fail do `PyO3` check: Python 3.14 > max supported 3.12 for pyo3 0.21.2
- Status: `FAILED (compat blocker)`
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
- `common` tests pass
- `database` crate tests fail nhiều case:
  - partial indexes not supported
  - temp DB file invalid (DuckDB init)
  - SQL injection prevention assertion failed
- Status: `PARTIAL FAIL`
- Mapping issue: `W1-ISS-008`

### 5) Health/observability baseline
Command:
```bash
bash scripts/health_check.sh
```
Observed:
- 4 service runtime đều `NOT running`
- Config read OK (`development`, `paper_trading=true`)
- Status: `FAILED (runtime not started)`
- Mapping issue: `W1-ISS-009`

## Baseline Matrix Summary

| Group | Command set | Status | Notes |
|---|---|---|---|
| Python Unit | pytest single critical unit file | FAIL | thiếu pandas |
| Rust Build | cargo check workspace | FAIL/PASS* | pass khi bật ABI3 forward flag |
| Rust Test | cargo test workspace | PARTIAL FAIL | database tests fail |
| Observability Smoke | health_check script | FAIL | services chưa chạy |
| Integration Smoke | signal->risk->execution runtime chain | BLOCKED | phụ thuộc service startup |

## Decision
- Week 1 baseline đạt mục tiêu "có đo được" nhưng chưa đạt "green".
- Cần xử lý ưu tiên trong tuần 1: `W1-ISS-001`, `W1-ISS-006`, `W1-ISS-008`, `W1-ISS-009`.

---
Last updated: 2026-04-14
