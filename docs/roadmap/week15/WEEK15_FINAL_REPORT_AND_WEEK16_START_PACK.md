# Week 15 Final Report + Week 16 Start Pack (Capital Allocation)

## 1) Executive summary

- Current gate status: `GO`.
- Final verdict: `GO`.
- Mục tiêu summary:
  1. Chốt volatility/regime sizing enforcement.
  2. Chốt drawdown adherence + allocation decision traceability.
  3. Chốt cross-strategy allocation guard và drift guard.
  4. Chốt artifact consistency với một verdict duy nhất.
  5. Chốt evidence để mở W16 Research Reproducibility.

## 2) KPI snapshot

| KPI Group | Target | Actual | Status | Evidence ID |
|---|---|---|---|---|
| Controls | volatility sizing enforcement 100% | `100%` | `CAPTURED_PASS` | `EV-W15-201` |
| Controls | regime-aware sizing enforcement 100% | `100%` | `CAPTURED_PASS` | `EV-W15-202` |
| Governance | allocation checklist completeness 100% | `100%` | `CAPTURED_PASS` | `EV-W15-203` |
| Governance | allocation decision traceability 100% | `100%` | `CAPTURED_PASS` | `EV-W15-204` |
| Risk Guard | drawdown adherence 100% | `100%` | `CAPTURED_PASS` | `EV-W15-205` |
| Risk Guard | cross-strategy interaction coverage 100% | `100%` | `CAPTURED_PASS` | `EV-W15-206` |
| Risk Guard | new breach count = 0 | `0` | `CAPTURED_PASS` | `EV-W15-207` |
| Quality | reproducibility drift <=1% | `0.5000%` | `CAPTURED_PASS` | `EV-W15-208` |
| Observability | correlation coverage >=99% | `100%` | `CAPTURED_PASS` | `EV-W15-209` |
| Compliance | findings = 0 | `0` | `CAPTURED_PASS` | `EV-W15-210` |
| Regression | W09-W14 guardrails pass | `100%` | `CAPTURED_PASS` | `EV-W15-301..306` |
| Governance | artifact consistency 100% | `100%` | `CAPTURED_PASS` | `EV-W15-401`,`EV-W15-402` |

## 3) Delivery status

- `W15-T01..T03`: `DONE` (freeze + allocation taxonomy).
- `W15-T04..T06`: `DONE` (clean-slate + baseline evidence capture).
- `W15-T07..T09`: `DONE` (volatility/regime sizing + drawdown + decision trace).
- `W15-T10..T12`: `DONE` (triage + cross-strategy + drift/risk hardening).
- `W15-T13..T16`: `DONE` (rerun baseline + gate rehearsal + verdict lock).
- `W15-T17..T18`: `DONE` (final closeout + Week 16 start pack).

## 4) Issue snapshot

- `W15-ISS-001..W15-ISS-012`: all closed in issue register.
- Rule chốt:
  - P0 open = `0`.
  - P1 unowned = `0`.
  - Allocation/drawdown controls enforce đúng policy.
  - Budget exception đã được escalation/justification qua `W15-ISS-010`.

## 5) Decision log

1. Contract freeze vẫn giữ nguyên (`schema_version` + `correlation_id`).
2. W15 ưu tiên capital allocation, không mở refactor production behavior.
3. W15 dùng W14 portfolio-controls verdict làm precondition.
4. Allocation decision truy vết được bằng evidence.
5. Mandatory blockers đã đóng theo evidence.
6. Gate decision khóa theo evidence đã capture.

## 6) Week 16 start pack (W15 = GO)

Backlog ưu tiên:

1. Reproducibility pack baseline: seed control + deterministic rerun profile.
2. Multi-rerun consistency checks: result drift thresholds và exception rules.
3. Reproducibility governance: evidence schema, owner, escalation.
4. Regression guard: giữ ổn định W09-W15 khi mở W16 scope.

Guardrail bắt buộc:

- W16 không đổi public envelope nếu không có `CR-W16-###`.
- W16 phải dùng W15 allocation verdict làm precondition.
- W16 không chốt GO nếu reproducibility checks thiếu evidence bắt buộc.

## 7) Recovery queue (fallback policy)

Nếu có rerun fail sau closeout:

1. Ưu tiên unblock P0 trước, rồi P1.
2. Mỗi blocker bắt buộc có owner + ETA + mitigation + evidence thiếu.
3. Rehearsal fail phải rerun theo cùng scenario và lưu expected/actual/evidence_id.
4. Chỉ được chuyển trạng thái sau khi rerun command profile chuẩn.

## 8) Final gate criteria

- [x] Volatility sizing enforcement `100%`.
- [x] Regime-aware sizing enforcement `100%`.
- [x] Allocation checklist completeness `100%`.
- [x] Allocation decision traceability `100%`.
- [x] Drawdown adherence `100%`.
- [x] Cross-strategy interaction coverage `100%`.
- [x] New-breach count `=0`.
- [x] Reproducibility drift `<=1%`.
- [x] Không còn P0 open.
- [x] Không còn P1 unowned.
- [x] Matrix bắt buộc không còn `CAPTURED_FAIL/BLOCKED_ENV`.
- [x] Correlation coverage `>=99%`.
- [x] Compliance findings `=0`.
- [x] W09-W14 regression guard pass.
- [x] Gate artifacts không mâu thuẫn.
