# Interface Portfolio Controls Spec W14

## 1) Contract freeze

W14 không đổi public wire contract. Canonical envelope vẫn là:

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

- Không đổi public envelope trong W14 nếu không có `CR-W14-###`.
- W14 chỉ chuẩn hóa portfolio-control governance records, enforcement policy và evidence linkage.
- Mọi control assertion phải truy vết được về evidence ID.

## 2) Portfolio control record contract

Portfolio control item tối thiểu:

| Field | Required | Description |
|---|---|---|
| `portfolio_check_id` | yes | control check identity |
| `strategy_set_id` | yes | single or multi-strategy context |
| `control_type` | yes | `EXPOSURE`, `CONCENTRATION` |
| `status` | yes | `ALLOW`, `REJECT`, `DEFER`, `BLOCKED` |
| `owner` | yes | decision owner |
| `limit_value` | yes | policy threshold used |
| `measured_value` | yes | measured value at decision time |
| `breach_flag` | yes | indicates breach |
| `decision_reason` | yes | rationale |
| `evidence_ids` | yes | linked evidence IDs |
| `risk_impact_flag` | yes | indicates risk boundary impact |
| `next_action` | yes | remediation/follow-up |
| `eta` | yes | expected closure ETA |

## 3) Enforcement policy

Mandatory rules:

- `measured_value > limit_value` for exposure => `REJECT` or `BLOCKED`.
- `measured_value > limit_value` for concentration => `REJECT` or `BLOCKED`.
- Any new exposure/concentration breach attributable to W14 => escalated issue.
- Missing decision metadata => `DEFER` until completed.

## 4) Gate verdict contract

Allowed final verdict values:

- `GO`
- `NO-GO`

Rules:

- Chỉ một verdict cuối trên toàn bộ artifacts.
- `GO` requires:
  - P0 open = 0.
  - P1 unowned = 0.
  - mandatory portfolio controls checklist = 100%.
  - no mandatory `CAPTURED_FAIL/BLOCKED_ENV`.
- `NO-GO` requires recovery queue với owner + ETA + evidence thiếu.

## 5) Evidence linkage contract

Mandatory mapping:

- Controls checklist row -> portfolio decision row.
- Portfolio decision row -> issue ID.
- Issue row -> evidence IDs.
- KPI row -> evidence IDs.
- Final decision -> evidence set used.

Missing links => control governance considered incomplete.

## 6) File-level edit contract

| Scope | Allowed change | Disallowed change | Evidence |
|---|---|---|---|
| Portfolio controls docs | add/update controls checklist, decision policy, breach reasons | bypass controls with manual override narrative | `EV-W14-201..216` |
| Test/governance scripts | minimal hooks only if enforcement evidence impossible otherwise | weaken checks to force pass | `EV-W14-101..110` |
| Governance files | sync checklist/roadmap/playbook mappings | mark GO without evidence | `EV-W14-401`,`EV-W14-402` |

## 7) Change record requirement

Open `CR-W14-001` if any of these happen:

1. Portfolio decision payload/contract changes in runtime paths.
2. Public API response contract changes for portfolio controls.
3. Event payload adds/removes public fields.
4. Runtime behavior is changed to satisfy controls checks.

Without CR, W14 remains portfolio-controls synchronization.
