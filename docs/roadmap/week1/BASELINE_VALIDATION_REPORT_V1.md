# Baseline Validation Report v1 (W01)

## Window

- W01 baseline snapshot (pre-gate run)

## Command Evidence

### 1) Python integration smoke baseline

```bash
python3 -m pytest tests/test_backtest_integration.py -v
```

Observed:

- Status: `AMBER` (2 Passed, 3 Failed)
- Failures: `test_engine_initialization`, `test_signal_to_order_path`, `test_risk_check_interception`
- Mapping issue: `W1-ISS-011`

### 2) Rust common crate check baseline

```bash
cd rust && cargo check -p common
```

Observed:

- Status: `PASSED`
- Mapping issue: `W1-ISS-006`

### 3) Rust common crate test baseline

```bash
cd rust && cargo test -p common
```

Observed:

- Status: `PASSED`
- Mapping issue: `W1-ISS-008`

### 4) Health/observability baseline

```bash
bash scripts/health_check.sh
```

Observed:

- Status: `PASSED` (All 4 services running)
- Mapping issue: `W1-ISS-009`

## Baseline Matrix Summary

| Group | Command set | Status | Notes |
|---|---|---|---|
| Python Unit | pytest integration smoke | AMBER | 2/5 pass, requires triage |
| Rust Build | cargo check common | PASSED | Core stable |
| Rust Test | cargo test common | PASSED | Core stable |
| Observability Smoke | health_check script | PASSED | Services reachable |
| Integration Smoke | signal->risk->execution | AMBER | Captured via pytest |

## Decision

- W01 baseline đạt trạng thái `AMBER/GREEN`. Một số lỗi Python integration cần xử lý ở W02 nhưng không chặn gate.

---
Last updated: W01 no-date mode sync
