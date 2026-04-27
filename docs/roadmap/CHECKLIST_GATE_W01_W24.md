# Checklist Gate Vận Hành W01-W24 (Tick Trực Tiếp)

## 1) Cách dùng

- File này là checklist vận hành duy nhất cho toàn bộ W01->W24.
- Team tick trực tiếp từng ô `[ ]` -> `[x]` trong mỗi tuần.
- Mỗi tuần chỉ được chốt `GO` khi tất cả mục bắt buộc đều hoàn thành và có evidence.

## 2) Rule cứng

- One-ID policy: chỉ dùng `correlation_id` trong contract/logging/gate artifacts.
- Interface/type chỉ đổi khi có trigger P0/P1 risk hoặc chặn live-ready.
- Nếu có đổi interface/type: bắt buộc có Change Record (`impact`, `compat`, `rollback`, `owner`, `evidence`).
- Rule test ownership: test phải bám hành vi codebase hiện tại.
- Cấm sửa production code chỉ để pass test lỗi thời.
- W01-W20: gate bằng compile/static/lint/type/smoke + evidence.
- W21-W24: full suite theo từng mức tăng dần.

## 3) Checklist chung (áp dụng mọi tuần)

- [x] Compile/check pass.
- [x] Static contract audit pass.
- [x] Lint/type check pass.
- [x] Smoke runtime critical path pass.
- [x] Không còn P0 mở.
- [x] Không có P1 unowned.
- [x] Evidence pack đầy đủ (`expected/actual/evidence_id`).
- [x] Artifact consistency pass (issue/gate/final report không mâu thuẫn).
- [x] Change budget trong ngưỡng hoặc có justification.
- [x] Rule test ownership được tuân thủ.

---

## W01 - Baseline & KPI Foundation

- [x] KPI charter + baseline report + issue register hoàn tất.
- [x] Contract/interface draft v0 có canonical envelope.
- [x] Go/No-Go W01 đã chốt.
- Evidence IDs: `EV-W01-001..110`
- Decision: [x] GO  [ ] NO-GO

## W02 - Contract Audit

- [x] Compatibility matrix + baseline audit + interface spec delta hoàn tất.
- [x] Mismatch P0 có owner + ETA + mitigation.
- [x] Go/No-Go W02 đã chốt.
- Evidence IDs: `EV-W02-001..115`
- Decision: [x] GO  [ ] NO-GO

## W03 - One-pass Contract Cutover

- [x] Parser hardening + mapping rollout + governance sync hoàn tất.
- [x] W3-T19/W3-T20/W3-T21/W3-T22/W3-T23 đã pass.
- [x] Go/No-Go W03 đã chốt.
- Evidence IDs: `EV-W03-515..520`
- Decision: [x] GO  [ ] NO-GO

## W04 - Integration Stabilization

- [x] Critical path signal->risk->execution ổn định.
- [x] Rollback path runnable và đã rehearsal.
- [x] Go/No-Go W04 đã chốt.
- Evidence IDs: `EV-W04-101..105`
- Decision: [x] GO  [ ] NO-GO

## W05 - Risk Limits v1

- [x] Risk limits theo symbol/strategy áp dụng đúng.
- [x] Reject semantics đúng policy.
- [x] Go/No-Go W05 đã chốt.
- Evidence IDs: `EV-W05-201..210`
- Decision: [x] GO  [ ] NO-GO

## W06 - Stop-loss Coherence

- [x] Stop-loss logic Python/Rust đồng bộ.
- [x] Regression stop-loss không tạo side-effect lớn.
- [x] Go/No-Go W06 đã chốt.
- Evidence IDs: `EV-W6-110, EV-W6-215, EV-W6-307`
- Decision: [x] GO  [ ] NO-GO

## W07 - Circuit Breaker Hardening

- [x] Trip/recover/cooldown rules ổn định.
- [x] Không có loop-trip trong stress scenario.
- [x] Go/No-Go W07 đã chốt.
- Evidence IDs: `EV-W7-101..108, EV-W7-201..215, EV-W7-301..306, EV-W7-401..402`
- Decision: [x] GO  [ ] NO-GO

## W08 - Execution Retry/Slippage

- [ ] Retry/slippage guardrails hoàn tất.
- [ ] Không duplicate order ở retry path.
- [ ] Go/No-Go W08 đã chốt.
- Evidence IDs: `EV-W8-101..108, EV-W8-201..217, EV-W8-301..307, EV-W8-401..402`
- Decision: [ ] GO  [ ] NO-GO

## W09 - Observability Contract

- [x] Logging/event schema thống nhất toàn pipeline.
- [x] Correlation continuity trên critical events.
- [x] Go/No-Go W09 đã chốt.
- Evidence IDs: `EV-W9-101..109, EV-W9-201..214, EV-W9-301..306, EV-W9-401..402`
- Decision: [x] GO  [ ] NO-GO

## W10 - API Health & SLO

- [x] SLO/alert profile chuẩn hóa.
- [x] Alert quality đạt ngưỡng đã chốt.
- [x] Go/No-Go W10 đã chốt.
- Evidence IDs: `EV-W10-101..110, EV-W10-201..217, EV-W10-301..306, EV-W10-401..402`
- Decision: [x] GO  [ ] NO-GO

## W11 - Incident Runbook

- [x] Runbook P0/P1 + escalation matrix hoàn tất.
- [x] Drill theo runbook đạt kết quả mục tiêu.
- [x] Go/No-Go W11 đã chốt.
- Evidence IDs: `EV-W11-101..110, EV-W11-201..216, EV-W11-301..306, EV-W11-401..402`
- Decision: [x] GO  [ ] NO-GO

## W12 - Ops Readiness Gate

- [x] Gate readiness pha vận hành hoàn tất.
- [x] Không còn blocker P0/P1 chưa owner.
- [x] Go/No-Go W12 đã chốt.
- Evidence IDs: `EV-W12-101..110, EV-W12-201..216, EV-W12-301..306, EV-W12-401..402`
- Decision: [x] GO  [ ] NO-GO

## W13 - Strategy Governance

- [ ] OOS/walk-forward checklist enforcement hoạt động.
- [ ] Strategy thiếu evidence bị block đúng rule.
- [ ] Go/No-Go W13 đã chốt.
- Evidence IDs: `EV-W13-101..110, EV-W13-201..216, EV-W13-301..306, EV-W13-401..402`
- Decision: [ ] GO  [ ] NO-GO

## W14 - Portfolio Controls

- [ ] Exposure/concentration controls hoạt động đúng.
- [ ] Portfolio risk checks pass.
- [ ] Go/No-Go W14 đã chốt.
- Evidence IDs: `EV-W14-101..110, EV-W14-201..216, EV-W14-301..306, EV-W14-401..402`
- Decision: [ ] GO  [ ] NO-GO

## W15 - Capital Allocation

- [ ] Position sizing theo volatility/regime hoàn tất.
- [ ] Drawdown policy adherence đạt ngưỡng.
- [ ] Go/No-Go W15 đã chốt.
- Evidence IDs: `EV-W15-101..110, EV-W15-201..216, EV-W15-301..306, EV-W15-401..402`
- Decision: [ ] GO  [ ] NO-GO

## W16 - Research Reproducibility

- [ ] Reproducibility pack + seed control hoàn tất.
- [ ] Rerun nằm trong ngưỡng cho phép.
- [ ] Go/No-Go W16 đã chốt.
- Evidence IDs: `EV-W16-101..110, EV-W16-201..216, EV-W16-301..306, EV-W16-401..402`
- Decision: [ ] GO  [ ] NO-GO

## W17 - Staging Hardening

- [ ] Soak test + ops hardening hoàn tất.
- [ ] Không còn P0/P1 chưa xử lý.
- [ ] Go/No-Go W17 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W18 - Canary Design

- [ ] Canary scenario + rollback scenario hoàn tất.
- [ ] Canary rollback rehearsal pass.
- [ ] Go/No-Go W18 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W19 - Safety Guardrails

- [ ] Kill-switch + risk-off playbook hoàn tất.
- [ ] Kill-switch response trong ngưỡng mục tiêu.
- [ ] Go/No-Go W19 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W20 - Canary Launch (Hẹp)

- [ ] Controlled canary execution ổn định.
- [ ] Không vượt risk boundary.
- [ ] Go/No-Go W20 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W21 - Final-phase Gate 1

- [ ] Full lint pass toàn repo.
- [ ] Full type + static pass toàn repo.
- [ ] Full unit baseline pass toàn repo.
- [ ] Test debt phát sinh mới trong W21 đã đóng.
- [ ] Go/No-Go W21 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W22 - Final-phase Gate 2

- [ ] Full Python unit + integration pass.
- [ ] Full Rust unit + integration pass.
- [ ] Test debt phát sinh mới trong W22 đã đóng.
- [ ] Go/No-Go W22 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W23 - Final-phase Gate 3

- [ ] Full cross-runtime/e2e pass.
- [ ] Soak + fault-injection pass.
- [ ] Test debt phát sinh mới trong W23 đã đóng.
- [ ] Go/No-Go W23 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W24 - Final-phase Gate 4

- [ ] Full regression rerun pass.
- [ ] Release gate `controlled live ready` pass.
- [ ] Gate artifacts cuối kỳ nhất quán hoàn toàn.
- [ ] Không còn P0 mở, không có P1 unowned.
- [ ] Final approval đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

---
Last updated: W07 GO - Full re-verification complete (Circuit Breaker Hardening).
