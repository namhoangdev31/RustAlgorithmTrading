# Security Standards

## Overview

This document defines the security policies and standards for the RustAlgorithmTrading platform, focusing on API safety, data integrity, and runtime resilience.

## 1. API Key Management

- **Zero-Storage Policy**: API keys (Alpaca, etc.) must **never** be committed to version control.
- **Environment Injection**: Keys should be injected via `.env` files or system environment variables (`ALPACA_API_KEY`).
- **Restrictive Permissions**: Ensure `.env` and `config/` files have `600` permissions on production servers.

## 2. Runtime Resilience (Rust)

- **Strict No-Panic Policy**: Production crates (Execution, Risk, Market Data) must avoid `.unwrap()`, `.expect()`, and `panic!()`.
- **Error Handling**: All fallible operations must return a `Result<T, TradingError>` and be handled gracefully.
- **Type Safety**: Use Strong Typing (e.g., `Symbol`, `OrderId` wrapper types) to prevent logic errors and accidental data mixing.

## 3. Network & Infrastructure

- **ZMQ Scoping**: ZeroMQ sockets should bind to `127.0.0.1` unless cross-host communication is explicitly required and secured via VPN/Stunnel.
- **Go Control Plane Auth**: The API on Port 8081 must use API Key authentication for all administrative endpoints (e.g., `/api/system/shutdown`).

## 4. Auditing

- **Immutable Logs**: All trade decisions and risk events are logged in structured JSON format and persisted to PostgreSQL for auditing.
- **Traceability**: Every transaction must be linked to a `correlation_id` originating from the market data tick that triggered it.

---
**Maintained By**: Security & Engineering Team
**Status**: Authoritative Standard
