# Interface Strategy Governance Spec W13

## 1) Contract freeze

W13 không đổi public wire contract. Canonical envelope vẫn là:

```json
{
  "schema_version": "v1.0.0",
  "correlation_id": "string",
  "event_type": "string",
  "timestamp": "ISO-8601",
  "payload": {}
}
```

Rule:

- Không đổi public envelope trong W13 nếu không có `CR-W13-###`.
- W13 chỉ chuẩn hóa strategy governance records, evidence policies và decision traceability.
- Mọi governance assertion phải truy vết được về evidence ID.

## 2) Strategy governance record contract

Strategy governance item tối thiểu:

| Field | Required | Description |
|---|---|---|
| `strategy_id` | yes | strategy identity |
| `submission_id` | yes | review submission context |
| `status` | yes | `NEW`, `IN_REVIEW`, `BLOCKED`, `APPROVED`, `REJECTED`, `DEFERRED` |
| `owner` | yes | reviewer/decision owner |
| `evidence_oos` | yes | OOS evidence reference |
| `evidence_walk_forward` | yes | walk-forward evidence reference |
| `evidence_additional` | optional | other supporting evidence |
| `decision_reason` | yes for non-NEW | rationale |
| `block_reason` | required if BLOCKED | standardized block reason |
| `drift_value` | required for quality check | reproducibility drift metric |
| `risk_impact_flag` | yes | indicates exposure/concentration impact |
| `evidence_ids` | yes | linked evidence IDs |
| `next_action` | yes | remediation or follow-up |
| `eta` | yes | expected closure ETA |

## 3) Enforcement policy

Mandatory rules:

- Missing `evidence_oos` => `BLOCKED`.
- Missing `evidence_walk_forward` => `BLOCKED`.
- `drift_value > 1%` => `BLOCKED` pending remediation.
- Any new exposure/concentration breach => `BLOCKED` and escalated issue.

## 4) Gate verdict contract

Allowed final verdict values:

- `GO`
- `NO-GO`

Rules:

- Chỉ một verdict cuối trên toàn bộ artifacts.
- `GO` requires:
  - P0 open = 0.
  - P1 unowned = 0.
  - mandatory governance checklist = 100%.
  - no mandatory `CAPTURED_FAIL/BLOCKED_ENV`.
- `NO-GO` requires recovery queue với owner + ETA + evidence thiếu.

## 5) Evidence linkage contract

Mandatory mapping:

- Checklist row -> Strategy decision row.
- Strategy decision row -> Issue ID.
- Issue row -> Evidence IDs.
- KPI row -> Evidence IDs.
- Final decision -> Evidence set used.

Missing links => governance considered incomplete.

## 6) File-level edit contract

| Scope | Allowed change | Disallowed change | Evidence |
|---|---|---|---|
| Strategy governance docs | add/update checklist, decision workflow, block reasons | bypass evidence gate with manual override narrative | `EV-W13-201..216` |
| Test/governance scripts | minimal hooks only if enforcement evidence impossible otherwise | weaken checks to force pass | `EV-W13-101..110` |
| Governance files | sync checklist/roadmap/playbook mappings | mark GO without evidence | `EV-W13-401`,`EV-W13-402` |

## 7) Change record requirement

Open `CR-W13-001` if any of these happen:

1. Strategy decision payload/contract changes in runtime paths.
2. Public API response contract changes for strategy governance endpoints.
3. Event payload adds/removes public fields.
4. Runtime behavior is changed to satisfy governance checks.

Without CR, W13 remains strategy-governance synchronization.
