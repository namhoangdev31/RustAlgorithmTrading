# Execution Plan 24 Tuần (No-Date Mode, Balanced Delivery)

## 1) Tóm tắt điều hành

Mục tiêu roadmap là đưa hệ thống giao dịch hybrid Python-Rust từ trạng thái **paper-trading ổn định** tới **controlled live ready** theo hướng **Balanced Delivery**, với trọng tâm:

- Giữ ổn định runtime và contract Python-Rust.
- Hardening Risk/Execution/Observability theo từng pha.
- Giữ 90-100% codebase hiện hữu (không refactor lan rộng).
- Khóa cơ chế chất lượng để tránh lỗi dồn cuối kỳ.

## 2) Nguyên tắc toàn cục (Global Rules)

1. **One-ID Policy**: toàn bộ roadmap chỉ dùng `correlation_id` cho tracking.
2. **No-Date Policy**: dùng nhịp `W01..W24`, không dùng ngày lịch thực tế.
3. **Codebase Preservation**: ưu tiên adapter/hardening; không thay đổi diện rộng nếu không bắt buộc.
4. **Change Budget**: mỗi tuần phải khai báo mức thay đổi; vượt ngưỡng cần justification + owner.
5. **Interface Change Control**: chỉ đổi interface/type khi có bằng chứng rủi ro P0/P1 hoặc chặn live-ready.
6. **Evidence-First**: mọi kết luận `GO` đều cần evidence pack (`expected/actual/evidence_id`).

### 2.1) Change Budget + Escalation Trigger (định lượng)

| Nhịp tuần | Change budget mặc định | Escalation trigger (bắt buộc raise) |
|---|---|---|
| W01-W04 | `<= 12 files` và `<= 600 LOC net/week` | vượt budget; chạm >2 module cross-runtime trong 1 tuần |
| W05-W08 | `<= 15 files` và `<= 800 LOC net/week` | vượt budget; phát sinh P0 regression từ patch tuần hiện tại |
| W09-W12 | `<= 18 files` và `<= 900 LOC net/week` | vượt budget; correlation coverage giảm dưới ngưỡng phase |
| W13-W16 | `<= 20 files` và `<= 1000 LOC net/week` | vượt budget; reproducibility/risk control lệch ngưỡng |
| W17-W20 | `<= 25 files` và `<= 1200 LOC net/week` | vượt budget; rollback rehearsal fail hoặc canary guardrail breach |
| W21-W24 | `<= 15 files` và `<= 700 LOC net/week` (chế độ hard-gate) | mọi thay đổi interface/type mới; full-suite fail; release blockers |

Escalation tối thiểu phải ghi:

- trigger cụ thể
- owner xử lý
- mitigation trong cùng tuần
- evidence ID

## 3) Public API / Interface / Type Policy

### Canonical Envelope

```json
{
  "schema_version": "v1.0.0",
  "correlation_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

### Chính sách đổi interface/type

- Mặc định **freeze** để giữ ổn định.
- Chỉ mở đổi khi trigger P0/P1 risk.
- Mọi thay đổi phải có **Change Record**: impact, compatibility path, rollback plan, owner, evidence.
- Nếu có thể xử lý bằng compatibility adapter thì **ưu tiên adapter**, không đổi wire-shape công khai.

### 3.1) Interface Change Record (template dùng ngay)

```markdown
Change Record ID: CR-Wxx-###
Tuần áp dụng: Wxx
Trigger: P0/P1 risk hoặc blocker live-ready

1) Problem Statement
- Mô tả rủi ro hiện tại (P0/P1), phạm vi ảnh hưởng.

2) Proposed Change
- Interface/type thay đổi gì (field/type/contract behavior).
- Lý do không thể xử lý chỉ bằng adapter (nếu có).

3) Impact & Compatibility
- Module bị ảnh hưởng (Python/Rust).
- Backward compatibility path.
- Migration/transition rule.

4) Rollback Plan
- Điều kiện kích hoạt rollback.
- Thao tác rollback.
- Expected recovery time.

5) Test & Evidence
- Testcase cần cập nhật theo codebase mới.
- Danh sách evidence_id bắt buộc.

6) Ownership & Approval
- Owner: ______
- Reviewer: ______
- Approval: [ ] planner [ ] coder [ ] tester [ ] ops
```

Điều kiện áp dụng CR:

- Không có CR hợp lệ => không được merge thay đổi interface/type.
- CR phải được link trong issue register + gate rehearsal notes tuần tương ứng.

## 4) Kế hoạch theo tuần (W01..W24)

| Tuần | Trọng tâm | Deliverable tuần | Exit criteria |
|---|---|---|---|
| W01 | Baseline & KPI foundation | KPI charter + baseline report + issue register | Baseline compile/static/smoke có evidence |
| W02 | Contract audit | Compatibility matrix + baseline audit + spec delta | Không còn mismatch P0 unowned |
| W03 | One-pass contract cutover | Parser hardening + mapping rollout + governance sync | Contract gate pass theo evidence |
| W04 | Integration stabilization | Critical path signal->risk->execution ổn định | Smoke integration ổn định, rollback runnable |
| W05 | Risk limits v1 | Per-symbol/per-strategy risk limits | Reject semantics đúng policy |
| W06 | Stop-loss coherence | Đồng bộ stop-loss Python/Rust | Stop-loss regressions không tạo side-effect lớn |
| W07 | Circuit breaker hardening | Trip/recover/cooldown ổn định | Không có loop trip trong stress scenario |
| W08 | Execution retry/slippage | Retry policy + slippage guardrails | Không duplicate order ở retry path |
| W09 | Observability contract | Envelope/logging schema thống nhất | Correlation continuity trên critical events |
| W10 | API health & SLO | SLO + alert profile chuẩn hóa | Alert quality đạt ngưỡng đã chốt |
| W11 | Incident runbook | Runbook P0/P1 + escalation matrix | Drill theo runbook đạt kết quả |
| W12 | Ops readiness gate | Gate readiness pha vận hành | Không có blocker P0/P1 chưa owner |
| W13 | Strategy governance | OOS/walk-forward checklist enforcement | Strategy thiếu bằng chứng bị block |
| W14 | Portfolio controls | Exposure/concentration controls | Portfolio risk checks pass |
| W15 | Capital allocation | Position sizing theo volatility/regime | Drawdown policy adherence rõ ràng |
| W16 | Research reproducibility | Reproducibility pack + seed control | Kết quả rerun trong ngưỡng cho phép |
| W17 | Staging hardening | Soak test + ops hardening | Không có P0/P1 chưa xử lý |
| W18 | Canary design | Canary + rollback scenario | Canary rollback rehearsal pass |
| W19 | Safety guardrails | Kill-switch + risk-off playbook | Kill-switch response trong ngưỡng mục tiêu |
| W20 | Canary launch (hẹp) | Controlled canary execution | Không vượt risk boundary |
| W21 | Final-phase gate 1 | Full lint + type + static + unit baseline | Full gate set W21 pass |
| W22 | Final-phase gate 2 | Full Python/Rust unit + integration | Full gate set W22 pass |
| W23 | Final-phase gate 3 | Cross-runtime/e2e + soak + fault injection | Full gate set W23 pass |
| W24 | Final-phase gate 4 | Full regression rerun + release gate | `controlled live ready` được thông qua |

### 4.1) Pass/Fail Threshold theo phase (định lượng)

| Phase | Tuần | Threshold bắt buộc để `GO` |
|---|---|---|
| Phase 1: Contract Foundation | W01-W04 | compile/static/lint/type pass `100%`; smoke critical path pass `>= 95%`; P0 open `= 0`; P1 unowned `= 0` |
| Phase 2: Risk/Execution Hardening | W05-W08 | phase-1 thresholds + duplicate order rate `<= 0.1%`; risk breach mới do thay đổi tuần hiện tại `= 0` |
| Phase 3: Observability/Ops Readiness | W09-W12 | phase-2 thresholds + correlation coverage `>= 99%`; alert false-positive `<= 15%`; alert false-negative critical `= 0` |
| Phase 4: Strategy/Portfolio Safety | W13-W16 | phase-3 thresholds + reproducibility drift `<= 1%`; exposure/concentration breach mới `= 0` |
| Phase 5: Staging/Canary Guardrails | W17-W20 | phase-4 thresholds + soak run không có P0; kill-switch response `<= 60s`; rollback rehearsal success `100%` |
| Phase 6: Release Hard Gates | W21-W24 | full lint/type/static pass `100%`; required unit/integration suites pass `100%`; required e2e/fault-injection suites pass `100%`; release blockers `= 0` |

## 5) Perfect Weekly Gate

### W01-W20 (không dùng full test suite)

Mỗi tuần bắt buộc đạt:

1. Compile/check pass.
2. Static contract audit pass.
3. Lint/type check pass.
4. Smoke runtime critical path pass.
5. Không còn P0 mở, không có P1 unowned.
6. Evidence pack đầy đủ và artifact nhất quán.
7. Không vi phạm change budget tuần hiện tại, hoặc đã có escalation record được duyệt.

### W21-W24 (full suite bắt buộc)

- W21: full lint + type + static + unit baseline toàn repo.
- W22: full Python/Rust unit + integration.
- W23: full cross-runtime/e2e + soak + fault injection.
- W24: full regression rerun + release-gate controlled live ready.

Hard-gate rule:

- Nếu một required suite fail ở W21-W24 => tuần đó mặc định `NO-GO`.
- Không defer test debt sang tuần kế tiếp trong W21-W24.

## 6) Continuous Test Readiness (W01-W24)

1. Mọi thay đổi code phải cập nhật testcase liên quan ngay trong cùng tuần.
2. Lint/type/static checks chạy liên tục ở mọi tuần.
3. Unit test drift phải được sửa kịp thời theo codebase mới.
4. **Rule cứng**: sửa test phải dựa trên hành vi codebase hiện tại.
5. Cấm “test-driven backfit”: không sửa code production chỉ để hợp test lỗi thời.
6. Mọi PR/change set phải chỉ rõ danh sách test được cập nhật và lý do cập nhật.

## 7) Điều kiện hoàn thành roadmap

1. Full gate chain W21-W24 pass liên tục, có evidence.
2. Không còn P0 mở và không có P1 unowned ở cuối W24.
3. Canary/live không vi phạm risk boundary đã chốt.
4. Gate artifacts không mâu thuẫn và rollback path đã được rehearsal.
5. Toàn bộ thay đổi interface/type có Change Record hợp lệ và trạng thái `Approved`.

## 8) Assumptions & defaults đã khóa

- Hướng triển khai: Balanced Delivery.
- Scope: full roadmap sync (không chỉ file 24-week).
- Interface change threshold: P0/P1 risk only.
- “Các tuần cuối” được khóa là W21-W24.
- Không bỏ lint/static ở bất kỳ tuần nào.

## Companion plans

- W01_OPERATIONS_PLAN.md (W01)
- W02_OPERATIONS_PLAN.md (W02)
- W03_OPERATIONS_PLAN.md (W03)
- W04_OPERATIONS_PLAN.md (W04)
- W05_OPERATIONS_PLAN.md (W05)
- W06_OPERATIONS_PLAN.md (W06)
- W07_OPERATIONS_PLAN.md (W07)
- W08_OPERATIONS_PLAN.md (W08)
- W09_OPERATIONS_PLAN.md (W09)
- W10_OPERATIONS_PLAN.md (W10)
- W11_OPERATIONS_PLAN.md (W11)
- [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md)

---
Last updated: no-date mode sync
