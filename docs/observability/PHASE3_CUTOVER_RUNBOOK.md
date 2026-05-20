# Phase 3 Cutover Runbook (Big Bang + Hard Gate)

Updated: 2026-05-08
Scope: Observability/control-plane serving only

Current status note:
- This runbook is retained as historical cutover procedure and rollback reference.
- Refer to `docs/roadmap/COMPLETION_REPORT.md` for final migration status.

## 1) Fixed Decisions

- Go stack: `chi` + `gorilla/websocket`
- Rollout mode: Big Bang switch
- Cutover policy: Hard Gate Required
- Data path v1: Go reads DuckDB/PostgreSQL directly
- Auth v1: internal `X-API-Key` + rate limit
- Out-of-scope: trading decisions, risk decisions, execution routing

## 2) Pre-Cutover Hard Gates

All gates must PASS with evidence in:

- `docs/roadmap/COMPLETION_REPORT.md`

Required:

1. Python observability baseline tests:
   - `python -m pytest tests/observability -q`
   - `python -m pytest tests/integration/test_observability_integration.py -q`
2. Go module tests:
   - `cd go && go test ./...`
3. API parity suite PASS:
   - `python -m pytest tests/observability/test_go_parity.py -q`
4. WS parity/soak PASS:
   - 10Hz stream stability
   - ping/pong + reconnect stability
   - error budget within agreed threshold
5. Rollback drill PASS end-to-end.

No cutover is allowed with partial evidence.

## 3) Big Bang Switch Procedure

1. Build and deploy Go control-plane artifact.
2. Verify Go health:
   - `/health`
   - `/health/ready`
   - `/health/live`
3. Freeze config and route all observability API/WS traffic to Go.
4. Set compatibility flags on Python side:
   - `GO_CONTROL_PLANE_ENABLED=true`
5. Validate dashboard + API smoke after switch.
6. Monitor p95/p99 latency, WS reconnect, and error budget for the gate window.

## 4) Rollback Triggers

Immediate rollback if any occurs:

- API parity break for in-scope endpoints.
- WS instability (disconnect storms, ping/pong failure, stream breakdown).
- auth/rate-limit policy malfunction.
- sustained latency/error-budget regression beyond approved threshold.
- control-plane runtime instability (panic/crash loop).

## 5) Rollback Procedure

1. Revert routing to previous Go control-plane serving release.
2. Re-enable Python serving:
3. Disable Go route from active traffic.
4. Capture incident evidence:
   - logs
   - artifact hashes
   - request/response samples
5. File incident and block re-cutover until gate rerun is green.

No degraded Go mode is used as production fallback in this policy.

## 6) Post-Cutover Validation

Checklist:

- dashboard works without client contract changes
- all in-scope endpoints return expected schema/status
- Go service health stays green
- rollback path remains runnable for one release cycle

## 7) Evidence Discipline

- Only real run artifacts are valid evidence.
- Estimated values are not allowed for GO sign-off.
- Evidence must include command, timestamp, environment, and output location.
