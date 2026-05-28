# Troubleshooting Guide

## Phase 3.5 Tri-Runtime Platform (Hardened)

Common issues, error scenarios, and solutions for the Rust/Python/Go trading ecosystem.

---

## 1. Connection & Communication (ZMQ)

### Issue: "Connection Refused" or "Address already in use"

**Symptoms**: Services fail to bind or connect to ports 5555-5558.
**Diagnosis**:

- Check if port is in use: `sudo lsof -i :5555`
- Verify ZMQ ports: `netstat -an | grep -E '(5555|5556|5557|5558)'`
**Solutions**:
- **Port Conflict**: Kill conflicting process: `sudo kill -9 $(lsof -t -i:5555)`
- **Startup Order**: Ensure services start in order: Market Data → Signal Bridge → Risk Manager → Execution Engine.

### Issue: "Protobuf Deserialization Failure"

**Symptoms**: Rust kernel receives signals but cannot parse them.
**Diagnosis**:

- Check logs in `rust/signal-bridge`. Look for "Version mismatch" or "Field missing".
**Solutions**:
- Ensure both Python and Rust use the same ZMQ contract version.
- Re-run `protoc` if schemas in `docs/api/ZMQ_PROTOCOL.md` were modified.

---

## 2. Environment & Build

### Issue: "Failed to access NumPy array API"

**Symptoms**: Rust unit tests or FFI bridge fails with a Python error.
**Diagnosis**: Occurs when `pyo3` uses a Python interpreter that lacks NumPy or has a mismatched version.
**Solutions**:

- Ensure `PYTHONPATH` points to the `uv` virtual environment.
- Run `uv sync` to ensure all native dependencies are present.

### Issue: "Metrics namespace collision"

**Symptoms**: Rust compilation fails with `use metrics::*` errors.
**Solutions**:

- Use absolute paths for the metrics crate: `use ::metrics::counter!;` instead of `use metrics::counter!;`.

---

## 3. Service-Specific Issues

### Market Data: "WebSocket Authentication Failed"

**Symptoms**: `ERROR market_data: Failed to authenticate with Alpaca`
**Solutions**:

- Verify `ALPACA_API_KEY` and `ALPACA_SECRET_KEY` in `.env`.
- Ensure you are using the correct `ALPACA_BASE_URL` (Paper vs Live).

### Risk Manager: "All Orders Rejected"

**Symptoms**: `ERROR risk_manager: Risk check failed: Position limit exceeded`
**Solutions**:

- Check current positions: `python ops/scripts/check_positions.py`
- Verify `ops/config/risk_limits.toml` thresholds.
- If circuit breaker tripped incorrectly, reset via Go Control Plane (Port 8081).

### Execution Engine: "API Rate Limit Exceeded"

**Symptoms**: `ERROR execution_engine: 429 Too Many Requests`
**Solutions**:

- Reduce `rate_limit_per_second` in `ops/config/system.json`.
- Implement order batching in the strategy layer.

---

## 4. Observability & Control Plane

### Issue: "Port 8081 already in use"

**Symptoms**: The Go Control Plane fails to start.
**Solutions**:

- Kill stale Go processes: `killall control_plane`
- Verify Port 8081 availability: `lsof -i :8081`

### Issue: "DuckDB Database is Locked"

**Symptoms**: Both Python and Go trying to write to the same `.db` file.
**Solutions**:

- Use the **Go Persistence Gateway** for all writes; Python should only read or use a separate read-only connection.

---

## 5. Performance & Latency

### Issue: "High GC Latency in Python"

**Symptoms**: Strategy signals are delayed by >100ms.
**Solutions**:

- Use the `generate_signal_frame` batch interface to reduce FFI call frequency.
- Monitor `gc.get_stats()` in the Python layer.

---
**Architect**: Antigravity AI
**Updated**: May 11, 2026
