# Incident Playbooks (Week 11 standardized)

## [PB-DRILL-001] Circuit Breaker Failure

- **Triage**: Check `cb_state` in metrics.
- **Mitigation**: Manual override to `Closed` or `HalfOpen` via `/admin/cb/reset`.
- **Evidence**: `EV-W11-001` (Screenshot of state transition in logs).

## [PB-DRILL-002] API Health Degradation

- **Triage**: Inspect `/health/ready` granular components.
- **Mitigation**: Scale component or restart service.
- **Evidence**: `EV-W11-002` (JSON response showing 100% component readiness).

## [PB-DRILL-003] Stop-Loss Parity Gap

- **Triage**: Compare `expected_sl` vs `actual_sl` in execution logs.
- **Mitigation**: Sync order state with broker (Alpaca/Paper).
- **Evidence**: `EV-W11-003` (Audit log showing 0 parity gap).

## [PB-DRILL-004] Stale WS Stream

- **Triage**: Check `last_heartbeat_timestamp` > 30s.
- **Mitigation**: Force WebSocket reconnect.
- **Evidence**: `EV-W11-004` (Log showing "Reconnected successfully").

## [PB-DRILL-005] Position Breach

- **Triage**: Check `net_exposure` vs `max_limit`.
- **Mitigation**: Immediate liquidating market order.
- **Evidence**: `EV-W11-005` (Risk report showing exposure < limit).
