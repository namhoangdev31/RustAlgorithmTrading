# Contract Baseline Report (Week 3 One-pass)

## Baseline preflight (clean-slate)

| Check | Command | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| Python cache cleanup | `find . -name "__pycache__" -exec rm -rf {} +` | cache removed | cache cleanup executed | `CAPTURED_PASS` | `EV-W3-001` |
| Rust clean-slate | `cd rust && cargo clean -p common -p signal-bridge -p risk-manager -p execution-engine` | fresh build state | removed `3192 files` (`405.8MiB`) | `CAPTURED_PASS` | `EV-W3-002` |

## Command evidence set

| Command group | Command | Expected | Actual | Status | Mapped issue | Evidence ID |
|---|---|---|---|---|---|---|
| Python signal flow | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | pass | `7 passed, 8 warnings` | `CAPTURED_PASS` | `W3-ISS-001`,`W3-ISS-002` | `EV-W3-101` |
| Python observability flow | `python -m pytest tests/integration/test_observability_integration.py -q` | pass | `7 passed, 11 warnings` | `CAPTURED_PASS` | `W3-ISS-005`,`W3-ISS-011` | `EV-W3-102` |
| Rust contract suites | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge -p risk-manager -p execution-engine` | pass | pass; all tests green | `CAPTURED_PASS` | `W3-ISS-001`,`W3-ISS-003`,`W3-ISS-010` | `EV-W3-103` |
| Rust workspace check | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | pass | pass (with warnings) | `CAPTURED_PASS` | `W3-ISS-009` | `EV-W3-104` |
| Runtime health | `bash scripts/health_check.sh` | pass | 4 core services running | `CAPTURED_PASS` | `W3-ISS-005` | `EV-W3-105` |
| Compliance audit | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | pass | pass; 100% coverage | `CAPTURED_PASS` | `W3-ISS-011` | `EV-W3-106` |
| Correlation source audit | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | scanned 68 files, 0 findings | `CAPTURED_PASS` | `W3-ISS-012` | `EV-W3-107` |

## Contract parser matrix

| Category | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| Positive | payload đúng chuẩn (`schema_version`,`correlation_id`) | `CAPTURED_PASS` | parser pass | `CAPTURED_PASS` | `EV-W3-201` |
| Negative | thiếu field bắt buộc | reject, no panic | `test_negative_parser_missing_fields` pass | `CAPTURED_PASS` | `EV-W3-202` |
| Negative | sai kiểu dữ liệu | reject, no panic | `test_negative_parser_wrong_type` pass | `CAPTURED_PASS` | `EV-W3-203` |
| Negative | sai enum/casing | reject, no panic | integration validation pass | `CAPTURED_PASS` | `EV-W3-204` |
| Negative | sai format timestamp | reject, no panic | `test_negative_parser_invalid_timestamp` pass | `CAPTURED_PASS` | `EV-W3-205` |
| Negative extreme | malformed JSON | reject, no panic | fuzz test pass | `CAPTURED_PASS` | `EV-W3-206` |
| Negative extreme | invalid UTF-8 sequence | reject, no panic | `test_fuzz_invalid_utf8` pass | `CAPTURED_PASS` | `EV-W3-207` |
| Cross-runtime | Python -> Rust | parse đúng | `test_backtest_signal_flow` pass | `CAPTURED_PASS` | `EV-W3-208` |
| Cross-runtime | Rust -> Python | parse đúng | `test_observability_integration` pass (`7 passed`) | `CAPTURED_PASS` | `EV-W3-209` |
| Observability | mismatch log quality | full trace | compliance audit pass | `CAPTURED_PASS` | `EV-W3-210` |

## Hardening matrix

| Task | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| `W3-T19` Fuzzing | malformed JSON | no panic | fuzz parser tests pass | `CAPTURED_PASS` | `EV-W3-211` |
| `W3-T20` Shadow log audit | 5 samples | no broken hop | rehearsal with 5 IDs pass | `CAPTURED_PASS` | `EV-W3-212` |
| `W3-T21` Playbook sync | docs sync | no drift | `PLAYBOOK.md` updated | `CAPTURED_PASS` | `EV-W3-213` |
| `W3-T22` Network disconnect | simulation | reconnect | disconnect/reconnect rehearsal via `bridge.zmq_bridge` pass với payload lớn (1MB) | `CAPTURED_PASS` | `EV-W3-214` |
| Rollback rehearsal | strict -> lax rollback (`SCHEMA_STRICT_MODE=false`) | phục hồi < 5 phút | rollback drill pass trong `0.102s` (`0.0017 phút`) | `CAPTURED_PASS` | `EV-W3-Rollback-001` |

## Performance baseline

| Metric | Target | Actual | Status | Evidence ID |
|---|---|---|---|---|
| `serialize_to_deserialize_avg_ms` | capture | `1.565 ms` | `CAPTURED_PASS` | `EV-W3-215` |
| `serialize_to_deserialize_p95_ms` | capture | `1.736 ms` | `CAPTURED_PASS` | `EV-W3-216` |
| `serialize_to_deserialize_max_ms` | capture | `1.781 ms` | `CAPTURED_PASS` | `EV-W3-217` |
| `signal_to_ack_e2e_avg_ms` | watermark | `2.233 ms` | `CAPTURED_PASS` | `EV-W3-218` |
| `signal_to_ack_e2e_p95_ms` | watermark | `2.424 ms` | `CAPTURED_PASS` | `EV-W3-219` |
| `signal_to_ack_e2e_max_ms` | watermark | `2.502 ms` | `CAPTURED_PASS` | `EV-W3-220` |

## Decision

- Trạng thái cuối cùng: **GO** (Week 3 Gate Passed).
- Ready for Week 4 Cutover.

---
Last updated: 2026-04-23 (Final Closeout)
