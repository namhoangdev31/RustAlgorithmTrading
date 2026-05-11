# Alpaca API Integration Guide

## Tri-Runtime Architecture (Rust Kernel Execution)

This guide defines how the Rust Trading Kernel integrates with the Alpaca Markets API.

---

## 1. Authentication

Credentials should be managed via environment variables and are injected into the `ExecutionConfig` in `rust/common/src/config.rs`.

### Environment Variables

```bash
ALPACA_API_KEY=YOUR_KEY
ALPACA_API_SECRET=YOUR_SECRET
ALPACA_API_URL=https://paper-api.alpaca.markets # Paper
# ALPACA_API_URL=https://api.alpaca.markets      # Live
```

---

## 2. Execution Flow

The **Order Router** (`rust/execution-engine/src/router.rs`) is responsible for:

1. **Rate Limiting**: Using a `governor`-based token bucket (default 200/sec).
2. **Idempotency**: Locking `client_order_id` to prevent duplicate execution.
3. **HTTPS Enforcement**: Strictly blocking non-HTTPS requests for live accounts.
4. **Retry Logic**: Exponential backoff for transient 502/503/429 errors.

---

## 3. Market Data (WebSocket)

The **Market Data Ingestor** (`rust/market-data/src/websocket.rs`) handles real-time streams:

- **Free (IEX)**: `wss://stream.data.alpaca.markets/v2/iex`
- **Pro (SIP)**: `wss://stream.data.alpaca.markets/v2/sip`

**Subscription Example**:

```rust
let auth_msg = json!({
    "action": "auth",
    "key": api_key,
    "secret": api_secret
});
// ... then subscribe
let sub_msg = json!({
    "action": "subscribe",
    "trades": ["AAPL"],
    "quotes": ["AAPL"],
    "bars": ["AAPL"]
});
```

---

## 4. Best Practices

- **Paper First**: Always run new strategies in Paper Trading for 48 hours.
- **Circuit Breakers**: Ensure the Go Control Plane (Port 8081) is active to monitor for global risk halts.
- **Position Reconciliation**: The system automatically reconciles local positions against Alpaca every 5 minutes.

---
**Architect**: Antigravity AI
**Updated**: May 11, 2026
