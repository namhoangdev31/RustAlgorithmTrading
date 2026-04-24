# Compatibility Policy v1 (No-Date Mode)

This policy defines official compatibility requirements for the hybrid Python-Rust trading system.

## 1) Runtime Compatibility (PyO3)

| Component | Requirement | Configuration |
|---|---|---|
| Python | 3.12+ (64-bit) | `PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1` |
| Rust | 1.75+ (Stable) | `pyo3 = { version = "0.21.0", features = ["abi3-py312"] }` |
| Tooling | `cargo`, `uv` | synchronized `.venv` for development |

### Enforcement

- All core scripts MUST export ABI3 flag where required.
- Rust crates using `pyo3` MUST pin minimum Python compatibility in `Cargo.toml`.

## 2) Schema Versioning Policy

### Envelope Structure

All cross-language messages MUST be wrapped in a v1 envelope:

```json
{
  "schema_version": "1.0",
  "correlation_id": "UUID-V4",
  "event_type": "string",
  "timestamp": "ISO-8601-UTC",
  "payload": { "...": "..." }
}
```

### Backward Compatibility

- `v1`: strict field validation.
- `v0`: permissive parsing in controlled transition path only.

## 3) Data Type Mapping Standards

| Logic Type | Python | Rust | Standard Representation |
|---|---|---|---|
| Timestamp | `datetime.utcnow()` | `DateTime<Utc>` | ISO 8601 string |
| Price/Qty | `float` (64-bit) | `f64` wrapper | decimal JSON number |
| Symbols | `str` | `Symbol(String)` | plain string |
| Enums | `Enum(str)` | `enum` | matching canonical tag set |

---
Approval status: active (no-date mode)
