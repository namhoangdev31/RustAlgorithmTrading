# Schema Version Baseline Report v1

## Window
- Week 3 schema baseline snapshot (implementation kickoff)
- Baseline mode: phase-based, không bám lịch thực tế

## Command Evidence Set

### 1) Python integration signal flow
Command:
```bash
python -m pytest tests/integration/test_backtest_signal_flow.py -q
```
Observed:
- Status: `PENDING CAPTURE`
- Mapping issue: `W3-ISS-001`, `W3-ISS-002`

### 2) Python observability integration
Command:
```bash
python -m pytest tests/integration/test_observability_integration.py -q
```
Observed:
- Status: `PENDING CAPTURE`
- Mapping issue: `W3-ISS-005`

### 3) Rust contract crates tests
Command:
```bash
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge -p risk-manager -p execution-engine
```
Observed:
- Status: `PENDING CAPTURE`
- Mapping issue: `W3-ISS-001`, `W3-ISS-003`, `W3-ISS-004`

### 4) Rust workspace compatibility check
Command:
```bash
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
```
Observed:
- Status: `PENDING CAPTURE`
- Mapping issue: `W3-ISS-009`

### 5) Runtime health smoke
Command:
```bash
bash scripts/health_check.sh
```
Observed:
- Status: `PENDING CAPTURE`
- Mapping issue: `W3-ISS-005`

## Test Matrix (schema-focused)

| Category | Scenario | Status |
|---|---|---|
| Positive | v1 payload đủ field bắt buộc | PENDING |
| Negative | thiếu `schema_version` | PENDING |
| Negative | sai type field contract | PENDING |
| Negative | sai enum value | PENDING |
| Versioning | `v0` permissive parse | PENDING |
| Versioning | `v1` strict parse | PENDING |

## Decision (initial)
- Baseline report tuần 3 dùng làm khung evidence cho phase execution.
- Mọi failed scenario phải map vào `W3-ISS-*` trước gate rehearsal.

---
Last updated: 2026-04-23
