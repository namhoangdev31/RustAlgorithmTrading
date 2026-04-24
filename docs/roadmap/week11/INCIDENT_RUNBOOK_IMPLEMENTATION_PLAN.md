# Incident Runbook Implementation Plan W11

## 1) Execution model

Chuỗi triển khai W11:

`Freeze -> Baseline Capture -> Runbook Rollout -> Drill Rehearsal -> Regression Guard -> Gate Reconciliation -> Final Closeout`

W11 mặc định là ops/readiness-focused. Nếu phát hiện thiếu hook trong code để capture drill evidence, chỉ được mở thay đổi tối thiểu và phải tạo `CR-W11-###`.

## 2) File-level guide

| File | Cần sửa | Bổ sung mới | Không được làm | Testcase bắt buộc | Evidence ID |
|---|---|---|---|---|---|
| `docs/operations/OPERATIONS_RUNBOOK.md` | Chuẩn hóa P0/P1 playbook, acknowledgement, closeout và postmortem flow | P0/P1 drill template, escalation ladder, evidence checklist | Không ghi resolved nếu thiếu verify evidence | Drill scenario matrix | `EV-W11-201..216` |
| `docs/operations/DISASTER_RECOVERY.md` | Đối chiếu recovery/rollback với runbook incident | Recovery handoff link cho P0/P1 | Không thay đổi recovery policy thiếu approval | rollback/recovery drill evidence | `EV-W11-207`,`EV-W11-209` |
| `src/observability/api/routes/system.py` | Chỉ inspect nếu alert acknowledgement/health evidence thiếu | Minimal endpoint evidence hook nếu thật sự cần `CR-W11` | Không đổi API schema để làm đẹp docs | `tests/observability/test_api.py` | `EV-W11-101`,`EV-W11-205` |
| `src/observability/api/websocket_manager.py` | Chỉ inspect nếu stale stream drill thiếu signal | Minimal stale heartbeat evidence nếu cần `CR-W11` | Không đổi stream contract công khai | observability integration | `EV-W11-102`,`EV-W11-208` |
| `scripts/health_check.sh` | Dùng làm baseline evidence, chỉ sửa khi check sai thực tế | Runbook command profile note nếu cần | Không bỏ check fail-fast | health check command | `EV-W11-108` |
| `scripts/compliance_audit.sh` | Dùng để audit one-ID/schema evidence | Không cần thay đổi nếu pass | Không bỏ correlation/version checks | compliance audit | `EV-W11-109` |
| `scripts/audit_correlation.py` | Dùng để audit source logging context | Không cần thay đổi nếu pass | Không whitelist rộng để giấu findings | correlation audit | `EV-W11-110` |
| `PLAYBOOK.md` | Đồng bộ file mapping W11 | Mapping artifact W11 | Không để file mới không có mapping | documentation audit | `EV-W11-402` |

## 3) Severity and escalation contract

| Severity | Ack SLA | Owner assignment SLA | Escalation trigger | Required evidence |
|---|---:|---:|---|---|
| P0 | `<=5m` | `<=10m` | ack miss, owner miss, critical false-negative, unresolved risk-off | alert, ack timestamp, owner, mitigation, verify, closeout, postmortem |
| P1 | `<=15m` | `<=30m` | ack miss, owner miss, mitigation ETA miss, repeated degraded service | alert, ack timestamp, owner, mitigation, verify, closeout |
| P2 | `<=1h` | next ops cycle | monitoring gap, non-critical evidence gap | owner, mitigation, evidence |
| P3 | `<=4h` | backlog triage | docs/cosmetic issue | owner or backlog link |

## 4) Drill flow contract

Mọi drill W11 phải ghi đủ:

1. `incident_id` hoặc drill ID.
2. `alert_id` hoặc source event.
3. severity.
4. component.
5. reason_code.
6. `correlation_id` nếu drill gắn với event runtime.
7. acknowledgement timestamp.
8. owner + backup owner.
9. mitigation action.
10. verification step.
11. closeout status.
12. postmortem/action-item nếu P0/P1.
13. evidence_id.

## 5) Required drills

| Drill | Trigger | Required response | Pass/Fail |
|---|---|---|---|
| API degraded | health/readiness/SLO degraded | ack, owner, identify degraded endpoint, mitigation, verify endpoint state | pass khi SLA + verify evidence đầy đủ |
| Execution alert | latency/failed order/duplicate risk alert | ack, classify risk-vs-execution, mitigation, side-effect check | pass khi no unowned P1 + duplicate side-effect evidence |
| Circuit breaker alert | breaker OPEN/reset pending | ack, owner, approve/reset decision, verify state | pass khi approval path evidence đầy đủ |
| Stale WebSocket stream | missed heartbeat/stale market data | ack, reconnect action, verify stream cadence | pass khi reconnect verify evidence đầy đủ |
| Position/risk breach | position loss/risk breach | ack, risk owner, stop/circuit context, verify containment | pass khi containment evidence đầy đủ |

## 6) Rollback / recovery policy

- W11 runbook/docs changes rollback bằng revert docs hoặc restoring previous runbook version; không ảnh hưởng trading runtime.
- Nếu minimal code hook được mở bằng `CR-W11`, rollback plan phải ghi rõ file, behavior, recovery time và validation command.
- Incident drill fail không được che bằng docs update; phải map issue, owner, ETA và rerun condition.

## 7) Dependency matrix

| Lane | Depends on | Blocks |
|---|---|---|
| Severity/escalation matrix | W09 taxonomy, W10 alert profile | all P0/P1 drills |
| P0/P1 playbooks | severity/escalation matrix | incident drill execution |
| Evidence closeout template | playbooks | gate decision |
| Regression guard | command profile | final closeout |
| Artifact reconciliation | baseline + issues + KPI | Week 12 handoff |

## 8) Change control

- Interface/type change threshold: P0/P1 risk only.
- Nếu cần thay đổi API/alert acknowledgement schema, tạo `CR-W11-001` trước khi patch.
- Change record phải link trong issue register, gate notes và final report.
- Mọi testcase update phải dựa trên hành vi codebase hiện tại.
