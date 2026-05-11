# Contributing Guide

## Rust Algorithm Trading (Tri-Runtime Platform)

Thank you for contributing! This guide defines the standards for our polyglot codebase (Rust, Python, Go).

---

## 1. Prerequisites

- **Rust 1.75+**: Trading Kernel (Execution, Risk, Market Data)
- **Python 3.11+**: Research Layer (Strategy, Features, ML)
- **Go 1.21+**: Control Plane (Observability, Alerts, Integrity)
- **uv**: Fast Python dependency manager
- **Docker**: For local orchestration testing

---

## 2. Development Workflow

### Polyglot Setup

```bash
# Setup Python
uv sync

# Build Rust Kernel
cd rust && cargo build --workspace

# Build Go Services
cd go && go build ./...
```

### Branching Policy

- `feature/*`: New capabilities (e.g., `feature/rsi-indicator`)
- `fix/*`: Bug fixes (e.g., `fix/zmq-handshake`)
- `refactor/*`: Performance or structure improvements
- `docs/*`: Documentation updates

---

## 3. Coding Standards

### Rust (The Kernel)

- Use **Strict No-Panic** policy in production crates.
- Follow the `Result<T, TradingError>` pattern from `rust/common`.
- All public traits must include documentation comments.
- Run `cargo clippy` and `cargo fmt` before every commit.

### Python (The Research Layer)

- Use **Type Hints** for all function signatures.
- Vectorize operations using NumPy/Pandas; avoid Python loops in hot paths.
- All strategies must implement the `generate_signal_frame` interface.
- Format with `ruff`.

### Go (The Control Plane)

- Follow standard Go project layout (`/internal`, `/pkg`).
- Ensure 80%+ test coverage for observability logic.
- Use structured logging for all system events.

---

## 4. Testing Requirements

- **Unit Tests**: Required for every new function/method.
- **Integration Tests**: Required for cross-runtime contracts (e.g., Python-to-Rust ZMQ signals).
- **Benchmarking**: Required for any changes to the Rust Market Data or Execution components.

```bash
# Run all tests
pytest tests/
cd rust && cargo test --workspace
cd go && go test ./...
```

---

## 5. Pull Request Process

1. **Self-Review**: Ensure all linting and local tests pass.
2. **Contract Validation**: If changing a message schema, update `docs/api/ZMQ_PROTOCOL.md`.
3. **Playbook Update**: If adding new files, update `PLAYBOOK.md` in the same PR.
4. **Approval**: At least one maintainer approval is required.

---
**Architect**: Antigravity AI
**Updated**: May 11, 2026
