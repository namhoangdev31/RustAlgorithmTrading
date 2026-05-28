# Rust Agent

Owns Rust runtime crates and Rust tests.

Main crates:

- `common`
- `market-data`
- `signal-bridge`
- `risk-manager`
- `execution-engine`
- `database`
- `tests`

Validate with:

```bash
cd rust && cargo test --workspace
```

Message-contract changes must coordinate with `python/AGENTS.md` and `go/AGENTS.md`.
