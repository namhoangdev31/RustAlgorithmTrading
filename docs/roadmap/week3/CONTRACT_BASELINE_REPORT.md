# Contract Baseline Report (Week 3 One-pass)

## Baseline preflight (clean-slate)

| Check | Command | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| Python cache cleanup | `find . -name "__pycache__" -exec rm -rf {} +` | cache removed | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-001` |
| Rust clean-slate | `cd rust && cargo clean -p common -p signal-bridge -p risk-manager -p execution-engine` | fresh build state | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-002` |

## Command evidence set

| Command group | Command | Expected | Actual | Status | Mapped issue | Evidence ID |
|---|---|---|---|---|---|---|
| Python signal flow | `python -m pytest tests/integration/test_backtest_signal_flow.py -q` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W3-ISS-001`,`W3-ISS-002` | `EV-W3-101` |
| Python observability flow | `python -m pytest tests/integration/test_observability_integration.py -q` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W3-ISS-005`,`W3-ISS-011` | `EV-W3-102` |
| Rust contract suites | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p common -p signal-bridge -p risk-manager -p execution-engine` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W3-ISS-001`,`W3-ISS-003`,`W3-ISS-010` | `EV-W3-103` |
| Rust workspace check | `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W3-ISS-009` | `EV-W3-104` |
| Runtime health | `bash scripts/health_check.sh` | pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W3-ISS-005` | `EV-W3-105` |
| Compliance audit | `bash scripts/compliance_audit.sh --check-correlation --check-versioning` | pass (fail-fast) | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W3-ISS-011` | `EV-W3-106` |
| Correlation source audit | `python scripts/audit_correlation.py --fail-on-findings` | `0 findings` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `W3-ISS-012` | `EV-W3-107` |

## Contract parser matrix

| Category | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| Positive | payload đúng chuẩn (`schema_version`,`correlation_id`) | `CAPTURED_PASS` | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-201` |
| Negative | thiếu field bắt buộc | reject có `error_code`, no panic | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-202` |
| Negative | sai kiểu dữ liệu | reject có `error_code`, no panic | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-203` |
| Negative | sai enum/casing | reject có `error_code`, no panic | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-204` |
| Negative | sai format timestamp | reject có `error_code`, no panic | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-205` |
| Negative extreme | malformed JSON | reject với `QUARANTINE`, no panic | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-206` |
| Negative extreme | invalid UTF-8 sequence | reject với `QUARANTINE`, no panic | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-207` |
| Cross-runtime | Python -> Rust | parse đúng và pipeline không đứt | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-208` |
| Cross-runtime | Rust -> Python | parse đúng và mapping chuẩn | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-209` |
| Observability | mismatch log quality | có `correlation_id`,`error_code`,`payload_preview` redacted | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-210` |

## Hardening matrix

| Task | Scenario | Expected | Actual | Status | Evidence ID |
|---|---|---|---|---|---|
| `W3-T19` Fuzzing | gửi JSON rác/cực lớn vào parser | luôn reject có mã lỗi, không panic | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-211` |
| `W3-T20` Shadow log audit | chọn ngẫu nhiên 5 `correlation_id` và dựng trace chain | không đứt trace giữa Python -> ZMQ -> Rust -> Observability | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-212` |
| `W3-T21` Playbook sync | doc class/type và contract behavior khớp code | review pass, không lệch map | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-213` |
| `W3-T22` Network disconnect simulation | ngắt ZMQ giữa lúc truyền message lớn | reconnect thành công, không treo pipeline | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-214` |

## Performance baseline

| Metric | Target | Actual | Status | Evidence ID |
|---|---|---|---|---|
| `serialize_to_deserialize_avg_ms` | capture bắt buộc | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-215` |
| `serialize_to_deserialize_p95_ms` | capture bắt buộc | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-216` |
| `serialize_to_deserialize_max_ms` | capture bắt buộc | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-217` |
| `signal_to_ack_e2e_avg_ms` | watermark bắt buộc | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-218` |
| `signal_to_ack_e2e_p95_ms` | watermark bắt buộc | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-219` |
| `signal_to_ack_e2e_max_ms` | watermark bắt buộc | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W3-220` |

## Decision
- Chỉ khi toàn bộ matrix bắt buộc `CAPTURED_PASS` mới đủ điều kiện gate.
- Nếu bất kỳ mục nào `CAPTURED_FAIL` hoặc `BLOCKED_ENV`, trạng thái mặc định là `NO-GO`.

---
Last updated: W03 no-date mode sync
