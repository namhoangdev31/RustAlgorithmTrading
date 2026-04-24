# Interface Capital Allocation Spec W15

## 1) Contract freeze

W15 không đổi public wire contract. Canonical envelope vẫn là:

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

- Không đổi public envelope trong W15 nếu không có `CR-W15-###`.
- W15 chỉ chuẩn hóa capital-allocation governance records, enforcement policy và evidence linkage.
- Mọi allocation assertion phải truy vết được về evidence ID.

## 2) Allocation control record contract

Allocation control item tối thiểu:

| Field | Required | Description |
|---|---|---|
| `allocation_check_id` | yes | control check identity |
| `strategy_set_id` | yes | single or multi-strategy context |
| `sizing_mode` | yes | `VOLATILITY`, `REGIME_AWARE`, `HYBRID` |
| `regime_class` | yes | current market regime class |
| `volatility_bucket` | yes | current volatility category |
| `drawdown_state` | yes | drawdown status at decision time |
| `status` | yes | `ALLOW`, `REJECT`, `DEFER`, `BLOCKED` |
| `owner` | yes | decision owner |
| `limit_value` | yes | policy threshold used |
| `measured_value` | yes | measured value at decision time |
| `decision_reason` | yes | rationale |
| `evidence_ids` | yes | linked evidence IDs |
| `risk_impact_flag` | yes | indicates risk boundary impact |
| `next_action` | yes | remediation/follow-up |
| `eta` | yes | expected closure ETA |

## 3) Enforcement policy

Mandatory rules:

- Missing `regime_class` or `volatility_bucket` => `DEFER`.
- Sizing outside policy band => `REJECT` or `BLOCKED`.
- Drawdown policy violation => `BLOCKED`.
- Any new exposure/concentration breach attributable to W15 => escalated issue.

## 4) Gate verdict contract

Allowed final verdict values:

- `GO`
- `NO-GO`

Rules:

- Chỉ một verdict cuối trên toàn bộ artifacts.
- `GO` requires:
  - P0 open = 0.
  - P1 unowned = 0.
  - mandatory allocation checklist = 100%.
  - no mandatory `CAPTURED_FAIL/BLOCKED_ENV`.
- `NO-GO` requires recovery queue với owner + ETA + evidence thiếu.

## 5) Evidence linkage contract

Mandatory mapping:

- Allocation checklist row -> allocation decision row.
- Allocation decision row -> issue ID.
- Issue row -> evidence IDs.
- KPI row -> evidence IDs.
- Final decision -> evidence set used.

Missing links => allocation governance considered incomplete.

## 6) File-level edit contract

| Scope | Allowed change | Disallowed change | Evidence |
|---|---|---|---|
| Allocation docs | add/update sizing checklist, drawdown policy mapping, decision reasons | bypass allocation policy with manual override narrative | `EV-W15-201..216` |
| Test/governance scripts | minimal hooks only if enforcement evidence impossible otherwise | weaken checks to force pass | `EV-W15-101..110` |
| Governance files | sync checklist/roadmap/playbook mappings | mark GO without evidence | `EV-W15-401`,`EV-W15-402` |

## 7) Change record requirement

Open `CR-W15-001` if any of these happen:

1. Allocation decision payload/contract changes in runtime paths.
2. Public API response contract changes for allocation controls.
3. Event payload adds/removes public fields.
4. Runtime behavior is changed to satisfy allocation checks.

Without CR, W15 remains capital-allocation synchronization.
