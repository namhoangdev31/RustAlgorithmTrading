# Risk Management Guide
## Phase 3.5 Operational Standards

This guide defines how risk is enforced within the Rust Trading Kernel.

---

## 1. Risk Architecture

The Risk Manager is a low-latency gatekeeper that sits between the **Signal Bridge** and the **Execution Engine**. Every order MUST pass the `LimitChecker` before reaching the exchange.

---

## 2. Configuration (`RiskConfig`)

Risk parameters are configured via the system configuration file (JSON).

| Parameter | Type | Description |
|---|---|---|
| `max_position_size` | f64 | Maximum notional value (Price * Qty) per symbol position. |
| `max_notional_exposure` | f64 | Maximum total notional exposure across all open positions. |
| `max_open_positions` | usize | Maximum number of concurrent open positions. |
| `stop_loss_percent` | f64 | Default stop-loss percentage for all new orders. |
| `trailing_stop_percent` | f64 | Percentage for trailing stop movements. |
| `enable_circuit_breaker` | bool | Toggle for global system halt on extreme loss. |
| `max_loss_threshold` | f64 | Daily realized loss limit to trigger circuit breaker. |

---

## 3. Enforcement Levels

### 3.1 Order-Level Validation
Checks individual order size against `max_position_size`. If the order notional exceeds the limit, it is rejected immediately.

### 3.2 Position-Level Validation
Checks if the *projected* position (Current Position + New Order) exceeds `max_position_size`.

### 3.3 Portfolio-Level Validation
- **Exposure**: Total notional across all symbols must be < `max_notional_exposure`.
- **Count**: Total active symbols must be < `max_open_positions`.

---

## 4. Operational Commands

### Monitoring Risk
Risk reports are emitted to the Go Control Plane (Port 8081).
```bash
# View active risk reports
curl http://localhost:8081/api/metrics/risk
```

### Hot-Reloading Config
The Rust kernel supports hot-reloading of risk limits without restart:
```bash
# Update the config file, then signal the process
pkill -HUP risk-manager
```

---

## 5. Future Hardening (Roadmap)
The following features are planned for Phase 4:
- **Volatility-Based Sizing**: Automatic position reduction based on ATR.
- **Correlation Limits**: Preventing over-exposure to highly correlated sectors.

---
**Architect**: Antigravity AI
**Updated**: May 11, 2026