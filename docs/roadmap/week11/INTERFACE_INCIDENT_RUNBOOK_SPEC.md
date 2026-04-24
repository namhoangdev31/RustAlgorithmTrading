# Interface Incident Runbook Spec W11

## 1) Contract freeze

W11 không đổi public wire contract. Canonical envelope vẫn là:

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

- Không đổi public envelope trong W11 nếu không có `CR-W11-###`.
- Incident runbook chỉ chuẩn hóa operational records, evidence, escalation và drill behavior.
- Legacy source nào thiếu `correlation_id` phải map ở boundary/observability layer nếu phát sinh code change hợp lệ.

## 2) Incident record contract

Incident/drill record trong W11 phải có tối thiểu:

| Field | Required | Description |
|---|---|---|
| `incident_id` | yes | ID incident hoặc drill |
| `severity` | yes | `P0`, `P1`, `P2`, `P3` |
| `component` | yes | component owner theo W09 taxonomy |
| `reason_code` | yes | reason canonical hoặc W10 alert reason |
| `alert_id` | yes for alert-driven incidents | alert/source ID từ W10 alert profile |
| `source_event_id` | optional | event nguồn nếu có |
| `correlation_id` | event-scoped | required nếu incident gắn runtime event |
| `status` | yes | `NEW`, `ACKNOWLEDGED`, `TRIAGING`, `MITIGATING`, `VERIFYING`, `RESOLVED`, `POSTMORTEM_PENDING`, `CLOSED` |
| `owner` | yes for P0/P1 | primary responder |
| `backup_owner` | yes for P0/P1 | fallback responder |
| `acknowledged_at` | yes for P0/P1 | timestamp ack |
| `mitigation_eta` | yes for P0/P1 | ETA mitigation |
| `verification_evidence_id` | yes for resolved | evidence verify before resolved |
| `postmortem_due` | yes for P0/P1 | due timestamp/policy |

## 3) Status transition policy

Allowed transition:

`NEW -> ACKNOWLEDGED -> TRIAGING -> MITIGATING -> VERIFYING -> RESOLVED -> POSTMORTEM_PENDING -> CLOSED`

Rules:

- `RESOLVED` requires `verification_evidence_id`.
- `CLOSED` requires postmortem complete or explicit P2/P3 exception.
- P0/P1 cannot skip `ACKNOWLEDGED` or `TRIAGING`.
- SLA breach must create/update issue with owner + ETA.

## 4) Escalation matrix contract

| Severity | Primary owner | Backup owner | Ack SLA | Mitigation owner SLA | Escalation condition |
|---|---|---|---:|---:|---|
| P0 | `ops` | `planner` or domain owner | `<=5m` | `<=10m` | missed ack, missed owner, critical false-negative, unresolved risk-off |
| P1 | domain owner | `ops` | `<=15m` | `<=30m` | missed ack, repeated degraded state, unowned mitigation |
| P2 | domain owner | `planner` | `<=1h` | next cycle | monitoring gap remains open |
| P3 | backlog owner | `planner` | `<=4h` | backlog triage | docs/cosmetic drift |

## 5) Error-handling and evidence policy

- Runbook steps must be deterministic enough that a second operator can rerun them.
- Failed drill must not be rewritten into pass; it must become issue evidence.
- Alert acknowledgement failure must be logged with structured reason and owner.
- Evidence pack must include expected, actual, status and evidence ID.

## 6) File-level edit contract

| Scope | Allowed change | Disallowed change | Evidence |
|---|---|---|---|
| Runbook docs | add/update P0/P1 flow, escalation, closeout evidence | remove existing safety actions without replacement | `EV-W11-201..216` |
| Observability routes | minimal hooks only if drill evidence impossible otherwise | public schema drift without CR | `EV-W11-101..110` |
| Scripts | fail-fast/audit reliability fixes only | weaken checks to pass gate | `EV-W11-108..110` |
| PLAYBOOK | add W11 file mapping | leave new files unmapped | `EV-W11-402` |

## 7) Change record requirement

Open `CR-W11-001` if any of these happen:

1. Alert acknowledgement response schema changes.
2. Incident record is persisted in a new runtime store.
3. Health/alert route behavior changes.
4. Event payload adds/removes public fields.

Without CR, W11 remains documentation/runbook/evidence-only.
