# KPI Charter W11 - Incident Runbook

## 1) Charter scope

W11 đo mức sẵn sàng vận hành incident cho P0/P1, dựa trên W09 observability taxonomy và W10 alert/SLO profile. KPI không dùng để “làm đẹp” báo cáo; chỉ được cập nhật khi có evidence ID hợp lệ.

## 2) KPI table

| KPI | Target | Measurement | Actual | Status | Evidence ID | Owner |
|---|---:|---|---|---|---|---|
| P0 acknowledgement time | `<= 5m` | alert timestamp -> ack timestamp | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W11-201` | `ops` |
| P1 acknowledgement time | `<= 15m` | alert timestamp -> ack timestamp | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W11-202` | `ops` |
| P0 mitigation owner assignment | `<= 10m` | alert timestamp -> owner assigned | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W11-203` | `ops` |
| P1 mitigation owner assignment | `<= 30m` | alert timestamp -> owner assigned | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W11-204` | `ops` |
| Required drill completion rate | `100%` | required drills completed/pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W11-205..209` | `ops` |
| Incident closeout evidence completeness | `100%` | resolved incidents with verify evidence | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W11-210` | `planner` |
| Postmortem template coverage | `100%` P0/P1 | required fields complete | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W11-211` | `planner` |
| Escalation matrix completeness | `100%` | owner/backup/SLA/ETA present | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W11-212` | `planner` |
| Critical false-negative count | `0` | critical drill alert missed | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W11-213` | `ops` |
| Alert false-positive sample | `<=15%` | sample false positives / total sample | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W11-214` | `ops` |
| Correlation coverage | `>=99%` | incident/event sample coverage | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W11-108` | `tester` |
| W05-W10 regression guard | `100%` | required slices pass | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W11-301..306` | `tester` |
| Artifact consistency | `100%` | baseline/issue/gate/final same verdict | `PENDING_CAPTURE` | `PENDING_EXECUTION` | `EV-W11-401`,`EV-W11-402` | `planner` |

## 3) KPI rules

- `CAPTURED_PASS` chỉ hợp lệ khi `actual` có số liệu hoặc log output tương ứng.
- `BLOCKED_ENV` phải có blocker, owner, ETA và rerun condition.
- KPI P0/P1 SLA không được ước lượng bằng cảm tính; bắt buộc có timestamp.
- KPI drill completion không được pass nếu thiếu verify/closeout evidence.
- KPI artifact consistency không được pass nếu baseline, issue register, gate notes và final report khác verdict.

## 4) Evidence source mapping

| Evidence range | Nguồn |
|---|---|
| `EV-W11-101..110` | command profile + clean-slate + audit baseline |
| `EV-W11-201..216` | incident drill + SLA + runbook scenario matrix |
| `EV-W11-301..306` | W05-W10 regression + governance hardening |
| `EV-W11-401..402` | artifact consistency + final gate decision |
