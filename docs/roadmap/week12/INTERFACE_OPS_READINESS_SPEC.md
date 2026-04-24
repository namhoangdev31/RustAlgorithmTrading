# Interface Ops Readiness Spec W12

## 1) Contract freeze

W12 không đổi public wire contract. Canonical envelope vẫn là:

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

- Không đổi public envelope trong W12 nếu không có `CR-W12-###`.
- W12 chỉ chuẩn hóa readiness records, gate evidence và governance consistency.
- Mọi readiness assertion phải truy vết được về evidence ID.

## 2) Readiness record contract

Readiness item record tối thiểu:

| Field | Required | Description |
|---|---|---|
| `readiness_item_id` | yes | ID checklist item |
| `domain` | yes | `technical`, `operational`, `governance` |
| `severity` | yes | `P0`, `P1`, `P2`, `P3` (nếu applicable) |
| `status` | yes | `PENDING_EXECUTION`, `CAPTURED_PASS`, `CAPTURED_FAIL`, `BLOCKED_ENV` |
| `owner` | yes | owner chịu trách nhiệm |
| `eta` | yes | ETA xử lý/rehearsal |
| `evidence_id` | yes | evidence mapping |
| `expected` | yes | tiêu chí mong đợi |
| `actual` | yes | kết quả thực tế hoặc blocker |
| `blocking_of` | optional | gate item bị block |
| `mitigation` | required if fail/block | kế hoạch xử lý |

## 3) Gate verdict contract

Allowed final verdict values:

- `GO`
- `NO-GO`

Rules:

- Chỉ một verdict cuối trên toàn bộ artifacts.
- `GO` requires:
  - P0 open = 0.
  - P1 unowned = 0.
  - Mandatory readiness checklist = 100% with valid evidence.
  - No mandatory `CAPTURED_FAIL/BLOCKED_ENV`.
- `NO-GO` requires recovery queue với owner + ETA + evidence thiếu.

## 4) Evidence linkage contract

Mandatory mapping:

- Baseline row -> Issue ID.
- Issue row -> Evidence IDs.
- KPI row -> Evidence IDs.
- Gate checklist row -> Evidence IDs.
- Final decision -> Evidence set used.

If any link missing: readiness considered incomplete.

## 5) File-level edit contract

| Scope | Allowed change | Disallowed change | Evidence |
|---|---|---|---|
| Readiness docs | add/update readiness items, owner, SLA, gate policy | contradictory policy across artifacts | `EV-W12-201..216` |
| Observability/routing scripts | minimal hooks only if readiness evidence impossible otherwise | schema drift without CR | `EV-W12-101..110` |
| Governance files | sync checklist/roadmap/playbook mappings | mark GO without evidence | `EV-W12-401`,`EV-W12-402` |

## 6) Change record requirement

Open `CR-W12-001` if any of these happen:

1. Public API response contract changes.
2. Alert acknowledgement payload shape changes.
3. Event payload adds/removes public fields.
4. Runtime behavior is changed to satisfy readiness checks.

Without CR, W12 remains readiness/governance synchronization.
