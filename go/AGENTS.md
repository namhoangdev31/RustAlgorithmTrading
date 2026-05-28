# Go Agent

Owns the observability control plane in `go/`.

Use this agent for HTTP routes, WebSocket fanout, health aggregation, metrics collection, DuckDB/Postgres storage, rate limiting, and ZMQ envelope parsing.

Validate with:

```bash
cd go && go test ./...
```

API or schema changes must coordinate with `nextjs/AGENTS.md`, `python/AGENTS.md`, and `ops/AGENTS.md`.
