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

- [ ] Compile/check pass.
- [ ] Static contract audit pass.
- [ ] Lint/type check pass.
- [ ] Smoke runtime critical path pass.
- [ ] Không còn P0 mở.
- [ ] Không có P1 unowned.
- [ ] Evidence pack đầy đủ (`expected/actual/evidence_id`).
- [ ] Artifact consistency pass (issue/gate/final report không mâu thuẫn).
- [ ] Change budget trong ngưỡng hoặc có justification.
- [ ] Rule test ownership được tuân thủ.

---

## W01 - Baseline & KPI Foundation

- [ ] KPI charter + baseline report + issue register hoàn tất.
- [ ] Contract/interface draft v0 có canonical envelope.
- [ ] Go/No-Go W01 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W02 - Contract Audit

- [ ] Compatibility matrix + baseline audit + interface spec delta hoàn tất.
- [ ] Mismatch P0 có owner + ETA + mitigation.
- [ ] Go/No-Go W02 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W03 - One-pass Contract Cutover

- [ ] Parser hardening + mapping rollout + governance sync hoàn tất.
- [ ] W3-T19/W3-T20/W3-T21/W3-T22/W3-T23 đã pass.
- [ ] Go/No-Go W03 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W04 - Integration Stabilization

- [ ] Critical path signal->risk->execution ổn định.
- [ ] Rollback path runnable và đã rehearsal.
- [ ] Go/No-Go W04 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W05 - Risk Limits v1

- [ ] Risk limits theo symbol/strategy áp dụng đúng.
- [ ] Reject semantics đúng policy.
- [ ] Go/No-Go W05 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W06 - Stop-loss Coherence

- [ ] Stop-loss logic Python/Rust đồng bộ.
- [ ] Regression stop-loss không tạo side-effect lớn.
- [ ] Go/No-Go W06 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W07 - Circuit Breaker Hardening

- [ ] Trip/recover/cooldown rules ổn định.
- [ ] Không có loop-trip trong stress scenario.
- [ ] Go/No-Go W07 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W08 - Execution Retry/Slippage

- [ ] Retry/slippage guardrails hoàn tất.
- [ ] Không duplicate order ở retry path.
- [ ] Go/No-Go W08 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W09 - Observability Contract

- [ ] Logging/event schema thống nhất toàn pipeline.
- [ ] Correlation continuity trên critical events.
- [ ] Go/No-Go W09 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W10 - API Health & SLO

- [ ] SLO/alert profile chuẩn hóa.
- [ ] Alert quality đạt ngưỡng đã chốt.
- [ ] Go/No-Go W10 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W11 - Incident Runbook

- [ ] Runbook P0/P1 + escalation matrix hoàn tất.
- [ ] Drill theo runbook đạt kết quả mục tiêu.
- [ ] Go/No-Go W11 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W12 - Ops Readiness Gate

- [ ] Gate readiness pha vận hành hoàn tất.
- [ ] Không còn blocker P0/P1 chưa owner.
- [ ] Go/No-Go W12 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W13 - Strategy Governance

- [ ] OOS/walk-forward checklist enforcement hoạt động.
- [ ] Strategy thiếu evidence bị block đúng rule.
- [ ] Go/No-Go W13 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W14 - Portfolio Controls

- [ ] Exposure/concentration controls hoạt động đúng.
- [ ] Portfolio risk checks pass.
- [ ] Go/No-Go W14 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W15 - Capital Allocation

- [ ] Position sizing theo volatility/regime hoàn tất.
- [ ] Drawdown policy adherence đạt ngưỡng.
- [ ] Go/No-Go W15 đã chốt.
- Evidence IDs: `____________________________`
- Decision: [ ] GO  [ ] NO-GO

## W16 - Research Reproducibility

- [ ] Reproducibility pack + seed control hoàn tất.
- [ ] Rerun nằm trong ngưỡng cho phép.
- [ ] Go/No-Go W16 đã chốt.
- Evidence IDs: `____________________________`
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
Last updated: W01-W24 checklist no-date mode sync
