# Contract Audit Baseline Report v1

## Window
- Week 2 contract baseline snapshot (kickoff template)
- Planned capture: 2026-04-28 (+07)

## Command Evidence Set

### 1) Python contract-adjacent unit baseline
Command:
```bash
python -m pytest tests/unit/python/test_strategy_base.py -q --maxfail=1
```
Observed:
- Status: `PENDING CAPTURE`
- Mapping issue: `W2-ISS-001`

### 2) Python integration boundary baseline
Command:
```bash
python -m pytest tests/integration/test_backtest_signal_flow.py -q
```
Observed:
- Status: `PENDING CAPTURE`
- Mapping issue: `W2-ISS-001`

### 3) Rust workspace check (default env)
Command:
```bash
cd rust && cargo check --workspace
```
Observed:
- Status: `PENDING CAPTURE`
- Mapping issue: `W2-ISS-002`

### 4) Rust workspace check (compat policy)
Command:
```bash
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
```
Observed:
- Status: `PENDING CAPTURE`
- Mapping issue: `W2-ISS-002`

### 5) Rust contract crates test baseline
Command:
```bash
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p signal-bridge -p common
```
Observed:
- Status: `PENDING CAPTURE`
- Mapping issue: `W2-ISS-003`

### 6) Runtime health traceability smoke
Command:
```bash
bash scripts/health_check.sh
```
Observed:
- Status: `PENDING CAPTURE`
- Mapping issue: `W2-ISS-006`

## Baseline Matrix Summary

| Group | Command set | Status | Notes |
|---|---|---|---|
| Python Unit | contract-adjacent unit slice | PENDING | capture Day 2 |
| Python Integration | signal flow boundary slice | PENDING | capture Day 2 |
| Rust Build | workspace check (default + compat) | PENDING | capture Day 2/3 |
| Rust Contract Test | signal-bridge/common slices | PENDING | capture Day 2 |
| Runtime Smoke | health + traceability sample | PENDING | capture Day 2/3 |

## Mismatch taxonomy used in report
- `schema`: thiếu/sai field contract.
- `semantics`: value hợp lệ nhưng nghĩa không thống nhất.
- `compat`: runtime/version/policy incompatibility.
- `observability`: thiếu traceability/envelope fields.
- `docs`: spec/canonical drift.

## Decision (initial)
- Baseline này là template vận hành cho Day-2 capture.
- Tất cả command sau khi capture phải map vào `issue_id + owner + ETA + mitigation`.

---
Last updated: 2026-04-23
