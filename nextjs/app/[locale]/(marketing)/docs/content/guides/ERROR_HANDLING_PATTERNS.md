# Error Handling Patterns & Best Practices
## Phase 3.5 Rust Kernel Standards

This guide defines the authoritative error handling patterns for the Rust Trading Kernel and the Python-Rust Bridge.

---

## 1. The `TradingError` Enum
The central error type for the system is defined in `rust/common/src/errors.rs`. All Rust crates should use this type or provide clear conversions to it.

```rust
pub enum TradingError {
    MarketData(String),
    WebSocket(String),
    OrderValidation(String),
    RiskCheck(String),
    Execution(String),
    Messaging(String),
    Configuration(String),
    Network(String),
    Exchange(String),
    Parse(String),
    Risk(String),
    Serialization(#[from] serde_json::Error),
    Io(#[from] std::io::Error),
    Unknown(String),
}
```

---

## 2. Core Patterns

### 2.1 The `Result<T>` Alias
We use a standardized `Result` type across all crates:
```rust
pub type Result<T> = std::result::Result<T, TradingError>;
```

### 2.2 Error Conversion (`From` trait)
Native Rust errors (IO, Serde) are automatically converted using the `#[from]` attribute in the `TradingError` enum. For other types, implement `From`:

```rust
impl From<MyExternalLibraryError> for TradingError {
    fn from(err: MyExternalLibraryError) -> Self {
        TradingError::Unknown(err.to_string())
    }
}
```

---

## 3. Propagation Guidelines

1. **Contextualization**: Always wrap lower-level errors with high-level domain context.
2. **No Panics**: Use of `unwrap()` and `expect()` is strictly forbidden in production modules (Market Data, Execution, Risk).
3. **Fail-Closed**: In the Risk Manager, any error in state lookup MUST result in a `RiskDecision::Reject`.

---

## 4. Cross-Runtime Error Propagation

When an error occurs in the Rust kernel that needs to be seen by Python:
1. **ZMQ Envelope**: The `Envelope` should contain an `error` field if applicable.
2. **Go Control Plane**: High-severity errors are logged to the Go-native observability hub on Port 8081.

---
**Architect**: Antigravity AI
**Updated**: May 11, 2026