# Compatibility Policy v1

This document defines the official compatibility requirements for the hybrid Python-Rust trading system. All components must adhere to these policies to ensure stable interop and reproducibility.

## 1. Runtime Compatibility (PyO3)

| Component | Requirement | Configuration |
|---|---|---|
| **Python** | 3.12+ (64-bit) | `PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1` |
| **Rust** | 1.75+ (Stable) | `pyo3 = { version = "0.21.0", features = ["abi3-py312"] }` |
| **Tooling** | `cargo`, `uv` | Must use synchronized `.venv` for development. |

### Enforcement
- All shell scripts (`start_services.sh`, `audit_rerun.sh`) MUST export the ABI3 flag.
- Rust crates using `pyo3` MUST specify the minimum Python version in `Cargo.toml`.

## 2. Schema Versioning Policy

### Envelope Structure
All messages cross-language MUST be wrapped in a `v1` envelope:
```json
{
  "schema_version": "1.0",
  "trace_id": "UUID-V4",
  "event_type": "string",
  "timestamp": "ISO-8601-UTC",
  "payload": { ... }
}
```

### Backwards Compatibility
- **v1 (Audit-Ready)**: Strict field validation. No missing P0 fields allowed.
- **v0 (Legacy)**: Permissive parsing. Used only during the transition phase.

## 3. Data Type Mapping Standards

| Logic Type | Python | Rust | Standard Representation |
|---|---|---|---|
| **Timestamp** | `datetime.utcnow()` | `DateTime<Utc>` | ISO 8601 String (ZMQ) |
| **Price/Qty** | `float` (64-bit) | `f64` (Price/Qty wrapper) | Decimal JSON number |
| **Symbols** | `str` | `Symbol(String)` | Plain string |
| **Enums** | `Enum(str)` | `enum` (Serde tag/content) | Kebab-case or PascalCase (matching Rust enum tag) |

---
**Approved**: 2026-04-23
