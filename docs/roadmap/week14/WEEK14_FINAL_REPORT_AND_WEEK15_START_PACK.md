# Week 14 Final Report + Week 15 Start Pack (Portfolio Controls)

## 1) Executive summary

- Current gate status: `PENDING_DECISION`.
- Final verdict: `PENDING_DECISION`.
- Mục tiêu summary:
  1. Chốt exposure/concentration controls enforcement.
  2. Chốt portfolio decision traceability + cross-strategy interaction guard.
  3. Chốt drift/risk guard theo phase-4 threshold.
  4. Chốt artifact consistency với một verdict duy nhất.
  5. Chốt evidence để mở W15 Capital Allocation.

## 2) KPI snapshot

| KPI Group | Target | Actual | Status | Evidence ID |
|---|---|---|---|---|
| Controls | exposure enforcement 100% | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-201` |
| Controls | concentration enforcement 100% | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-202` |
| Governance | controls checklist completeness 100% | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-203` |
| Governance | decision traceability 100% | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-204` |
| Risk Guard | cross-strategy interaction coverage 100% | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-205` |
| Risk Guard | exposure breach mới = 0 | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-206` |
| Risk Guard | concentration breach mới = 0 | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-207` |
| Quality | reproducibility drift <=1% | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-208` |
| Observability | correlation coverage >=99% | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-209` |
| Compliance | findings = 0 | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-210` |
| Regression | W09-W13 guardrails pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-301..306` |
| Governance | artifact consistency 100% | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W14-401`,`EV-W14-402` |

## 3) Delivery status

- `W14-T01..T03`: `PENDING_EXECUTION` (freeze + controls taxonomy).
- `W14-T04..T06`: `PENDING_EXECUTION` (clean-slate + baseline evidence capture).
- `W14-T07..T09`: `PENDING_EXECUTION` (exposure/concentration rollout + decision trace).
- `W14-T10..T12`: `PENDING_EXECUTION` (triage + cross-strategy + drift/risk hardening).
- `W14-T13..T16`: `PENDING_EXECUTION` (rerun baseline + gate rehearsal + verdict lock).
- `W14-T17..T18`: `PENDING_EXECUTION` (final closeout + Week 15 start pack).

## 4) Issue snapshot

- `W14-ISS-001..W14-ISS-012`: trạng thái chi tiết theo [ISSUE_REGISTER_WEEK14.md](ISSUE_REGISTER_WEEK14.md).
- Rule chốt:
  - P0 open phải về 0.
  - P1 unowned phải về 0.
  - Exposure/concentration controls phải enforce đúng policy.

## 5) Decision log

1. Contract freeze vẫn giữ nguyên (`schema_version` + `correlation_id`).
2. W14 ưu tiên portfolio controls, không mở refactor production behavior.
3. W14 dùng W13 governance verdict làm precondition.
4. Portfolio decision phải truy vết được bằng evidence.
5. Nếu còn blocker mandatory, W14 phải giữ `NO-GO`.
6. Gate decision chỉ dựa trên evidence đã capture.

## 6) Week 15 start pack (nếu W14 = GO)

Backlog ưu tiên:

1. Capital Allocation baseline: position sizing theo volatility/regime.
2. Drawdown policy adherence: decision flow + enforcement evidence.
3. Portfolio-to-capital interaction guardrails: tránh conflict giữa allocation và controls.
4. Regression guard: giữ ổn định W09-W14 khi mở W15 scope.

Guardrail bắt buộc:

- W15 không đổi public envelope nếu không có `CR-W15-###`.
- W15 phải dùng W14 portfolio-controls verdict làm precondition.
- W15 không chốt GO nếu capital-allocation checks thiếu evidence bắt buộc.

## 7) Recovery queue (nếu W14 = NO-GO)

1. Ưu tiên unblock P0 trước, rồi P1.
2. Mỗi blocker bắt buộc có owner + ETA + mitigation + evidence thiếu.
3. Rehearsal fail phải rerun theo cùng scenario và lưu expected/actual/evidence_id.
4. Chỉ được chuyển trạng thái sau khi rerun command profile chuẩn.

## 8) Final gate criteria

- [ ] Exposure control enforcement `100%`.
- [ ] Concentration control enforcement `100%`.
- [ ] Portfolio controls checklist completeness `100%`.
- [ ] Portfolio decision traceability `100%`.
- [ ] Cross-strategy interaction coverage `100%`.
- [ ] Exposure breach mới `=0`.
- [ ] Concentration breach mới `=0`.
- [ ] Reproducibility drift `<=1%`.
- [ ] Không còn P0 open.
- [ ] Không còn P1 unowned.
- [ ] Matrix bắt buộc không còn `CAPTURED_FAIL/BLOCKED_ENV`.
- [ ] Correlation coverage `>=99%`.
- [ ] Compliance findings `=0`.
- [ ] W09-W13 regression guard pass.
- [ ] Gate artifacts không mâu thuẫn.
