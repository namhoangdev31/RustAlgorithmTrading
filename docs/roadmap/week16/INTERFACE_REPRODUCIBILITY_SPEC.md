# Interface Reproducibility Spec W16

## 1) Contract freeze

W16 không đổi public wire contract. Canonical envelope vẫn là:

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

- Không đổi public envelope trong W16 nếu không có `CR-W16-###`.
- W16 chỉ chuẩn hóa reproducibility governance records, enforcement policy và evidence linkage.
- Mọi reproducibility assertion phải truy vết được về evidence ID.

## 2) Reproducibility record contract

Reproducibility item tối thiểu:

| Field | Required | Description |
|---|---|---|
| `repro_check_id` | yes | check identity |
| `run_set_id` | yes | rerun set context |
| `seed_profile_id` | yes | seed profile used |
| `rerun_profile` | yes | deterministic rerun profile class |
| `status` | yes | `PASS`, `FAIL`, `DEFER`, `BLOCKED` |
| `owner` | yes | decision owner |
| `drift_value` | yes | measured reproducibility drift |
| `threshold_value` | yes | policy threshold |
| `exception_reason` | required if exception applied | exception rationale |
| `decision_reason` | yes | rationale |
| `evidence_ids` | yes | linked evidence IDs |
| `risk_impact_flag` | yes | indicates risk boundary impact |
| `next_action` | yes | remediation/follow-up |
| `eta` | yes | expected closure ETA |

## 3) Enforcement policy

Mandatory rules:

- Missing `seed_profile_id` => `DEFER`.
- Missing deterministic `rerun_profile` => `DEFER`.
- `drift_value > threshold_value` => `BLOCKED`.
- Exception without evidence => `BLOCKED`.
- Any new exposure/concentration breach attributable to W16 => escalated issue.

## 4) Gate verdict contract

Allowed final verdict values:

- `GO`
- `NO-GO`

Rules:

- Chỉ một verdict cuối trên toàn bộ artifacts.
- `GO` requires:
  - P0 open = 0.
  - P1 unowned = 0.
  - mandatory reproducibility checklist = 100%.
  - no mandatory `CAPTURED_FAIL/BLOCKED_ENV`.
- `NO-GO` requires recovery queue với owner + ETA + evidence thiếu.

## 5) Evidence linkage contract

Mandatory mapping:

- Reproducibility checklist row -> rerun decision row.
- Rerun decision row -> issue ID.
- Issue row -> evidence IDs.
- KPI row -> evidence IDs.
- Final decision -> evidence set used.

Missing links => reproducibility governance considered incomplete.

## 6) File-level edit contract

| Scope | Allowed change | Disallowed change | Evidence |
|---|---|---|---|
| Reproducibility docs | add/update seed/rerun checklist, exception mapping, decision reasons | bypass reproducibility policy with manual override narrative | `EV-W16-201..216` |
| Test/governance scripts | minimal hooks only if enforcement evidence impossible otherwise | weaken checks to force pass | `EV-W16-101..110` |
| Governance files | sync checklist/roadmap/playbook mappings | mark GO without evidence | `EV-W16-401`,`EV-W16-402` |

## 7) Change record requirement

Open `CR-W16-001` if any of these happen:

1. Reproducibility decision payload/contract changes in runtime paths.
2. Public API response contract changes for reproducibility controls.
3. Event payload adds/removes public fields.
4. Runtime behavior is changed to satisfy reproducibility checks.

Without CR, W16 remains reproducibility synchronization.
