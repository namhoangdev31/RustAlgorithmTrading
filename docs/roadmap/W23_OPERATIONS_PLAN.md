# Ke Hoach Van Hanh Tuan 23 (W23, Final-Phase Gate 3)

## 1) Muc tieu tuan

W23 tap trung trien khai **Final-Phase Gate 3** theo roadmap 24 tuan:

1. Chay full cross-runtime/e2e, soak va fault-injection theo hard-gate rule.
2. Dong e2e/fault debt phat sinh trong tuan, khong defer sang W24.
3. Chung minh pipeline Python-Rust van on dinh duoi dieu kien loi co kiem soat.
4. Chot gate W23 bang evidence that voi mot verdict duy nhat.

Rang buoc W23:

- Giu contract canonical da freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Khong doi public wire-shape mac dinh; moi doi interface/type phai co `CR-W23-###`.
- One-ID policy giu nguyen: chi dung `correlation_id`.
- W23 la hard-gate phase release: khong defer test debt sang W24.
- W23 khong chot `GO` neu con bat ky required suite fail.

## 1.1) Thay doi & Nguong (Change Budget & Thresholds)

| Chi so | Nguong bat buoc (W23) |
|---|---|
| Change Budget (W21-W24) | `<= 15 files` va `<= 700 LOC net` |
| Full cross-runtime/e2e | `100% pass` |
| Soak required scenarios | `100% pass` |
| Fault-injection required scenarios | `100% pass` |
| E2E/fault debt moi trong tuan | `0` open tai gate lock |
| Release blocker moi | `0` open |
| Correlation coverage critical events | `>= 99%` |
| Compliance findings | `0` |
| W09-W22 regression guard pass rate | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |
| Artifact consistency | `100%` |

---

## 2) Task board theo chu ky (W23-T01 -> W23-T18)

### Pha 1: Freeze scope & hard-gate3 taxonomy

- `W23-T01` Freeze pham vi W23: cross-runtime/e2e, soak, fault-injection, debt closure.
- `W23-T02` Freeze taxonomy: e2e blockers, soak blockers, fault classes, release blockers.
- `W23-T03` Freeze acceptance thresholds cho hard-gate3.
- `W23-T03A` Freeze no-broad-refactor rule: chi sua toi thieu de dong gate fail thuc.

### Pha 2: Baseline capture

- `W23-T04` Chay clean-slate preflight va ghi evidence nen.
- `W23-T05` Chay command profile hard-gate3, cap nhat matrix `expected/actual`.
- `W23-T06` Capture gaps: cross-runtime/e2e failures, soak instability, fault-injection failures.

### Pha 3: Hard-gate3 rollout

- `W23-T07` Lane 1: cross-runtime/e2e closure theo owner modules.
- `W23-T08` Lane 2: soak stability closure + runtime watermark capture.
- `W23-T09` Lane 3: fault-injection closure + deterministic recovery rerun.

### Pha 4: Triage & governance closure

- `W23-T10` Triage mismatch theo cum A/B/C, gan owner/ETA/mitigation.
- `W23-T11` Recheck release blockers mapping + escalation logs neu vuot budget.
- `W23-T12` Compliance/correlation rehearse va khoa findings.

### Pha 5: Closure + rerun

- `W23-T13` Rerun full hard-gate3 profile sau fixes de xac nhan pass lien tuc.
- `W23-T14` Khoa issue register theo evidence that, dong P0/P1 gate-blocking.

### Pha 6: Gate rehearsal

- `W23-T15` Dong bo Baseline -> Issue Register -> KPI -> Gate Notes -> Final Report.
- `W23-T16` Rehearsal verdict `GO/NO-GO` theo phase-6 thresholds.

### Pha 7: Final closeout

- `W23-T17` Xuat final report W23 voi mot trang thai gate duy nhat.
- `W23-T18` Chot Week 24 start pack (full regression rerun + controlled live ready release gate).

---

## 3) Checklist van hanh

### Checklist hang ngay

- Co it nhat 1 dong evidence duoc cap nhat tu `PENDING_EXECUTION` sang trang thai thuc.
- Mismatch moi duoc map issue trong 24h, co owner + ETA + mitigation.
- Khong de P0 o trang thai `NEW/IN_PROGRESS` qua chu ky ke tiep.
- Hard-gate rows phai co expected + actual + evidence_id.
- Suite fail phai co root-cause + owner + rerun plan.
- Artifact reconciliation phai co source-of-truth va mot verdict duy nhat.

### Checklist cuoi tuan

- Baseline matrix khong con placeholder cho muc bat buoc da chay.
- Full cross-runtime/e2e pass `100%`.
- Soak + fault-injection pass `100%`.
- E2E/fault debt moi trong tuan = `0` open.
- W09-W22 regression guard pass.
- Khong con P0 open, khong co P1 unowned.
- Artifact consistency `100%`.
- Gate artifacts khong mau thuan `GO/NO-GO`.

---

## 4) Issue ton dong khoi tao W23

### P0

| ID | Issue | Tac dong | Dieu kien dong W23 | Owner mac dinh | ETA |
|---|---|---|---|---|---|
| `W23-ISS-001` | Full cross-runtime/e2e fail | Hard-gate fail ngay | e2e pass `100%` | `tester` | `Pha 3` |
| `W23-ISS-002` | Soak required scenarios fail | Release stability khong dat | soak pass `100%` | `ops` | `Pha 3` |
| `W23-ISS-003` | Fault-injection recovery fail | Safety recovery khong tin cay | fault-injection pass `100%` | `coder` | `Pha 3` |

### P1

| ID | Issue | Tac dong | Dieu kien dong W23 | Owner mac dinh | ETA |
|---|---|---|---|---|---|
| `W23-ISS-004` | E2E/fault debt moi chua dong | No chat luong don W24 | debt open = 0 | `tester` | `Pha 4` |
| `W23-ISS-005` | Triage thieu owner/ETA | Ops closure cham | triage completeness `100%` | `planner` | `Pha 4` |
| `W23-ISS-006` | Correlation/compliance fail | Audit/debug yeu | coverage>=99%, findings=0 | `tester` | `Pha 4` |
| `W23-ISS-007` | W09-W22 regression chua rerun | Regression risk tich luy | regression guard pass `100%` | `tester` | `Pha 5` |
| `W23-ISS-008` | Gate artifacts mau thuan verdict | Governance fail | one final verdict across artifacts | `planner` | `Pha 6` |
| `W23-ISS-009` | Week 24 handoff thieu priorities | W24 kickoff mo ho | start pack complete | `planner` | `Pha 7` |
| `W23-ISS-010` | Change budget vuot nguong khong escalation | Tang regression risk | escalation record hop le | `planner` | `Pha 5` |

### P2

| ID | Issue | Tac dong | Dieu kien dong W23 | Owner mac dinh | ETA |
|---|---|---|---|---|---|
| `W23-ISS-011` | Soak/fault runtime/toil chua do | Capacity kho du bao | throughput watermark captured | `ops` | `Pha 5` |
| `W23-ISS-012` | Evidence linkage thieu suite->issue->gate | Audit cham | linkage complete | `planner` | `Pha 6` |

---

## 5) Test plan W23 (full-gate3-focused)

### Command profile chuan

```bash
python -m pytest tests/e2e -q
python -m pytest tests/integration -q
python -m pytest tests/observability -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test --workspace
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
bash scripts/compliance_audit.sh --check-correlation --check-versioning
python scripts/audit_correlation.py --fail-on-findings
```

### Scenario bat buoc

1. Full cross-runtime/e2e pass `100%`.
2. Soak required scenarios pass `100%`.
3. Fault-injection required scenarios pass `100%`.
4. E2E/fault debt phat sinh moi = `0` open.
5. Correlation/compliance audits pass (`0 findings`).
6. Regression guard W09-W22 pass sau W23 rollout.
7. Artifact consistency rehearsal pass.
8. Week 24 start pack completeness pass.

### Rule test ownership

1. Test phan anh hanh vi codebase hien tai.
2. Khi thay doi hop le theo spec, test cap nhat cung tuan va co evidence.
3. Cam sua production code chi de chieu test loi thoi.

## 5.1) Gate Checklist (Nhip W23)

Su dung truc tiep [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho cac dau muc bat buoc.

- Evidence ID W23: `EV-W23-###`
- Interface/type change (neu co) bat buoc co `CR-W23-###`.

---

## 6) Mau bao cao cuoi tuan

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W23-T01..W23-T18`.
4. Issue Register snapshot.
5. Rehearsal results (cross-runtime/e2e, soak, fault-injection, governance, regression).
6. Final Gate Decision (`GO/NO-GO`) voi evidence.
7. Week 24 Start Pack.

---

## 7) KPI dictionary W23

### Hard-Gate Quality

- Full Cross-runtime/E2E Pass Rate.
- Soak Scenario Pass Rate.
- Fault-injection Scenario Pass Rate.
- E2E/Fault Debt Closure Rate.

### Reliability

- P0 Open Count.
- P1 Unowned Count.
- W09-W22 Regression Guard Pass Rate.

### Alert & Observability

- Correlation Coverage.
- Compliance Findings Count.

### Engineering Quality

- Change Budget Compliance.
- Regression Count Sau Rerun.

### Governance

- Artifact consistency.
- Evidence completeness.
- Ownership SLA (P1 unowned = 0).

---

## 8) Assumptions & defaults

- W23 la hard-gate tuan ba phase release, khong mo refactor lon.
- One-ID policy giu nguyen: `correlation_id`.
- Khong doi wire-shape cong khai neu khong co trigger P0/P1 risk.
- Khong ghi `Done/Pass/GO` khi thieu evidence ID hop le.
- Neu mot muc bat buoc fail o rerun cuoi: giu `NO-GO` + recovery queue co owner/ETA.
- Neu can doi API/interface de dong hard-gate, phai mo `CR-W23-001`; uu tien adapter/compatibility truoc.

---

## 9) Execution artifacts (Week 23)

- [week23/KPI_CHARTER_WEEK23.md](week23/KPI_CHARTER_WEEK23.md)
- [week23/FINAL_PHASE_GATE3_BASELINE_REPORT.md](week23/FINAL_PHASE_GATE3_BASELINE_REPORT.md)
- [week23/FINAL_PHASE_GATE3_IMPLEMENTATION_PLAN.md](week23/FINAL_PHASE_GATE3_IMPLEMENTATION_PLAN.md)
- [week23/ISSUE_REGISTER_WEEK23.md](week23/ISSUE_REGISTER_WEEK23.md)
- [week23/INTERFACE_RELEASE_GATE3_SPEC.md](week23/INTERFACE_RELEASE_GATE3_SPEC.md)
- [week23/GATE_REHEARSAL_NOTES.md](week23/GATE_REHEARSAL_NOTES.md)
- [week23/WEEK23_FINAL_REPORT_AND_WEEK24_START_PACK.md](week23/WEEK23_FINAL_REPORT_AND_WEEK24_START_PACK.md)

---

## 10) Execution status (initial)

- `W23-T01..T18`: `PENDING_EXECUTION`.
- Command profile: `PENDING_EXECUTION`.
- Scenario/hardening matrix: `PENDING_EXECUTION`.
- Final gate: `PENDING_DECISION` cho den khi du evidence that.
