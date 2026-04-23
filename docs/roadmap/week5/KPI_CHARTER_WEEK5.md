# KPI Charter Week 5 (Risk Limits v1)

## Mục tiêu
Định nghĩa KPI cho W05 để bảo đảm Risk Limits v1 được enforce đúng policy mà không gây regression lên critical path.

## KPI dictionary

| Nhóm | KPI | Formula | Ngưỡng | Owner | Gate impact |
|---|---|---|---|---|---|
| Reliability | Critical Path Smoke Pass Rate | `passed_smoke_runs / total_smoke_runs` | `< 0.95` là đỏ | tester | blocking |
| Reliability | P0 Open Count | `count(P0 status != DONE)` | `> 0` là đỏ | planner | blocking |
| Reliability | Duplicate Order Rate (reject path) | `duplicate_orders / total_reject_events` | `> 0.001` là đỏ | ops | blocking |
| Risk Quality | Symbol Limit Compliance | `passed_symbol_limit_cases / total_symbol_limit_cases` | `< 1.0` là đỏ | coder | blocking |
| Risk Quality | Strategy Limit Compliance | `passed_strategy_limit_cases / total_strategy_limit_cases` | `< 1.0` là đỏ | coder | blocking |
| Risk Quality | BVA Coverage | `passed_bva_cases / total_bva_cases` | `< 1.0` là đỏ | tester | blocking |
| Risk Quality | Patch-induced Risk Breaches | `count(new_breach_from_week_patch)` | `> 0` là đỏ | ops | blocking |
| Contract | Reject Semantics Completeness | `rejects_with_reason_and_snapshot / total_rejects` | `< 1.0` là đỏ | coder | blocking |
| Contract | Enum Canonicalization Compliance | `enum_mapped_events / total_reject_events` | `< 1.0` là đỏ | coder | blocking |
| Contract | Bridge Fail-fast Reject Ratio | `rejects_blocked_pre_execution / total_rejects` | `< 1.0` là đỏ | coder | blocking |
| Observability | Correlation Continuity (reject events) | `reject_events_with_correlation_id / total_reject_events` | `< 1.0` là đỏ | ops | blocking |
| Observability | Redaction Compliance (`limit_snapshot`) | `public_logs_masked / total_public_reject_logs` | `< 1.0` là đỏ | ops | blocking |
| Observability | Correlation Audit Findings | `findings_from_audit_correlation` | `> 0` là đỏ | tester | blocking |
| Performance | Risk Lookup Overhead (ms) | `post_rollout_latency_ms - w4_baseline_latency_ms` | `> 0.2` là đỏ | ops | blocking |
| Engineering | Build/Static Check Profile | `successful_checks / total_checks` | `< 1.0` là đỏ | tester | blocking |
| Engineering | Change Budget Compliance | `within_budget_runs / total_runs` | `< 1.0` là amber/red | planner | advisory |
| Governance | Artifact Consistency | `consistent_artifacts / total_artifacts` | `< 1.0` là đỏ | planner | blocking |

## KPI board format
- Cột bắt buộc: `KPI`, `Target`, `Actual`, `Status`, `Owner`, `Evidence ID`, `Action`.
- Status dùng: `GREEN`, `AMBER`, `RED`.
- Không được set `GREEN` nếu thiếu `Evidence ID`.

## Escalation rule
1. Nếu Duplicate Order Rate > 0.1% thì gate tự động `NO-GO` tạm thời.
2. Nếu Patch-induced Risk Breaches > 0 thì freeze rollout lane mới và rollback lane gần nhất.
3. Nếu Correlation Audit Findings > 0 thì block gate cho đến khi `0 findings`.
4. Nếu Risk Lookup Overhead > 0.2ms thì mở mitigation cache và rerun benchmark trước gate.
5. Nếu Redaction Compliance < 1.0 thì block gate cho đến khi mask đủ `limit_snapshot`.
6. Nếu vượt change budget, phải có escalation record + giảm scope trong cùng tuần.

## KPI snapshot (captured)

| KPI | Target | Actual | Status | Evidence ID |
|---|---|---|---|---|
| Critical Path Smoke Pass Rate | `>= 0.95` | smoke suites passed | `GREEN` | `EV-W5-101`,`EV-W5-102` |
| P0 Open Count | `= 0` | `0` | `GREEN` | `EV-W5-304` |
| Duplicate Order Rate (reject path) | `<= 0.001` | guardrail tests passed | `GREEN` | `EV-W5-205`,`EV-W5-302` |
| Symbol Limit Compliance | `= 1.0` | pass | `GREEN` | `EV-W5-201` |
| Strategy Limit Compliance | `= 1.0` | pass | `GREEN` | `EV-W5-202` |
| BVA Coverage | `= 1.0` | pass | `GREEN` | `EV-W5-207`,`EV-W5-208` |
| Patch-induced Risk Breaches | `= 0` | `0` | `GREEN` | `EV-W5-103`,`EV-W5-105` |
| Reject Semantics Completeness | `= 1.0` | pass | `GREEN` | `EV-W5-203`,`EV-W5-301` |
| Enum Canonicalization Compliance | `= 1.0` | pass | `GREEN` | `EV-W5-209` |
| Bridge Fail-fast Reject Ratio | `= 1.0` | pass | `GREEN` | `EV-W5-210`,`EV-W5-302` |
| Correlation Continuity | `= 1.0` | pass | `GREEN` | `EV-W5-107` |
| Redaction Compliance (`limit_snapshot`) | `= 1.0` | pass | `GREEN` | `EV-W5-211`,`EV-W5-305` |
| Correlation Audit Findings | `= 0` | `0` | `GREEN` | `EV-W5-107` |
| Risk Lookup Overhead (ms) | `<= 0.2` | pass (`<=0.2`) | `GREEN` | `EV-W5-212` |
| Build/Static Check Profile | `= 1.0` | pass | `GREEN` | `EV-W5-101..104` |
| Change Budget Compliance | `= 1.0` | pass (`5 files`, `180 LOC net`) | `GREEN` | `EV-W5-401` |
| Artifact Consistency | `= 1.0` | one-decision gate synced | `GREEN` | `EV-W5-304` |

---
Last updated: 2026-04-23 (W05 KPI captured)
