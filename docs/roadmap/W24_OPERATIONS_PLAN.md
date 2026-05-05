# Ke Hoach Van Hanh Tuan 24 (W24, Final-Phase Gate 4)

## 1) Muc tieu tuan

W24 tap trung trien khai **Final-Phase Gate 4** theo roadmap 24 tuan:

1. Chay full regression rerun va release gate `controlled live ready`.
2. Khoa toan bo release blockers, final approval va rollback readiness.
3. Xac nhan khong con P0 open, khong co P1 unowned, khong co artifact mau thuan.
4. Chot roadmap bang evidence that voi mot verdict duy nhat.

Rang buoc W24:

- Giu contract canonical da freeze: `schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`.
- Khong doi public wire-shape mac dinh; moi doi interface/type phai co `CR-W24-###`.
- One-ID policy giu nguyen: chi dung `correlation_id`.
- W24 la release hard-gate cuoi: khong defer blocker ra ngoai roadmap.
- W24 khong chot `GO` neu con bat ky required suite fail hoac release blocker.

## 1.1) Thay doi & Nguong (Change Budget & Thresholds)

| Chi so | Nguong bat buoc (W24) |
|---|---|
| Change Budget (W21-W24) | `<= 15 files` va `<= 700 LOC net` |
| Full regression rerun | `100% pass` |
| Release gate controlled live ready | `100% pass` |
| Required release blockers | `0` open |
| Final approval checklist | `100%` |
| Rollback path readiness | `100%` rehearsal evidence |
| Gate artifact consistency | `100%` |
| P0/P1 governance | P0 open `= 0`; P1 unowned `= 0` |
| Correlation/compliance findings | coverage `>=99%`, findings `=0` |

---

## 2) Task board theo chu ky (W24-T01 -> W24-T18)

### Pha 1: Freeze scope & release taxonomy

- `W24-T01` Freeze pham vi W24: full regression, release gate, final approval.
- `W24-T02` Freeze taxonomy: release blockers, approval states, rollback readiness states.
- `W24-T03` Freeze acceptance thresholds cho controlled live ready.
- `W24-T03A` Freeze no-broad-refactor rule: chi sua release-blocking defects co evidence.

### Pha 2: Baseline capture

- `W24-T04` Chay clean-slate preflight va ghi evidence nen.
- `W24-T05` Chay full regression command profile, cap nhat matrix `expected/actual`.
- `W24-T06` Capture gaps: regression failures, release blockers, approval gaps.

### Pha 3: Release gate rollout

- `W24-T07` Lane 1: full regression closure.
- `W24-T08` Lane 2: controlled-live-ready checklist closure.
- `W24-T09` Lane 3: rollback readiness + release approval evidence capture.

### Pha 4: Triage & governance closure

- `W24-T10` Triage mismatch theo cum A/B/C, gan owner/ETA/mitigation.
- `W24-T11` Recheck final release blockers mapping + escalation logs neu vuot budget.
- `W24-T12` Compliance/correlation rehearse va khoa findings.

### Pha 5: Closure + rerun

- `W24-T13` Rerun full regression sau fixes de xac nhan pass lien tuc.
- `W24-T14` Khoa issue register theo evidence that, dong P0/P1/release blockers.

### Pha 6: Gate rehearsal

- `W24-T15` Dong bo Baseline -> Issue Register -> KPI -> Gate Notes -> Final Report.
- `W24-T16` Rehearsal verdict `GO/NO-GO` theo release hard-gate thresholds.

### Pha 7: Final closeout

- `W24-T17` Xuat final report W24 voi mot trang thai gate duy nhat.
- `W24-T18` Chot final approval + controlled live ready signoff hoac recovery queue cuoi.

---

## 3) Checklist van hanh

### Checklist hang ngay

- Co it nhat 1 dong evidence duoc cap nhat tu `PENDING_EXECUTION` sang trang thai thuc.
- Mismatch moi duoc map issue trong 24h, co owner + ETA + mitigation.
- Khong de P0 o trang thai `NEW/IN_PROGRESS` qua chu ky ke tiep.
- Release gate rows phai co expected + actual + evidence_id.
- Required suite fail phai co root-cause + owner + rerun plan.
- Artifact reconciliation phai co source-of-truth va mot verdict duy nhat.

### Checklist cuoi tuan

- Baseline matrix khong con placeholder cho muc bat buoc da chay.
- Full regression rerun pass `100%`.
- Release gate `controlled live ready` pass.
- Gate artifacts cuoi ky nhat quan hoan toan.
- Khong con P0 open, khong co P1 unowned.
- Final approval da chot.
- Artifact consistency `100%`.
- Gate artifacts khong mau thuan `GO/NO-GO`.

---

## 4) Issue ton dong khoi tao W24

### P0

| ID | Issue | Tac dong | Dieu kien dong W24 | Owner mac dinh | ETA |
|---|---|---|---|---|---|
| `W24-ISS-001` | Full regression rerun fail | Release gate fail ngay | regression pass `100%` | `tester` | `Pha 3` |
| `W24-ISS-002` | Controlled live ready gate fail | Khong du dieu kien release | release checklist pass `100%` | `planner` | `Pha 3` |
| `W24-ISS-003` | Rollback readiness fail | Khong dam bao recoverability | rollback readiness pass `100%` | `ops` | `Pha 3` |

### P1

| ID | Issue | Tac dong | Dieu kien dong W24 | Owner mac dinh | ETA |
|---|---|---|---|---|---|
| `W24-ISS-004` | Release blocker taxonomy thieu owner | Governance release fail | blocker ownership `100%` | `planner` | `Pha 4` |
| `W24-ISS-005` | Correlation/compliance fail | Audit/debug yeu | coverage>=99%, findings=0 | `tester` | `Pha 4` |
| `W24-ISS-006` | W09-W23 regression guard chua rerun | Regression risk tich luy | regression guard pass `100%` | `tester` | `Pha 5` |
| `W24-ISS-007` | Gate artifacts mau thuan verdict | Governance fail | one final verdict across artifacts | `planner` | `Pha 6` |
| `W24-ISS-008` | Final approval thieu evidence | Release signoff khong hop le | approval checklist complete | `planner` | `Pha 7` |
| `W24-ISS-009` | Change budget vuot nguong khong escalation | Tang regression risk | escalation record hop le | `planner` | `Pha 5` |

### P2

| ID | Issue | Tac dong | Dieu kien dong W24 | Owner mac dinh | ETA |
|---|---|---|---|---|---|
| `W24-ISS-010` | Release runtime/toil chua do | Capacity kho du bao | throughput watermark captured | `ops` | `Pha 5` |
| `W24-ISS-011` | Evidence linkage thieu release chain | Audit cham | linkage complete | `planner` | `Pha 6` |
| `W24-ISS-012` | Post-roadmap watchlist chua chot | Handoff sau roadmap mo ho | watchlist complete | `planner` | `Pha 7` |

---

## 5) Test plan W24 (release-gate-focused)

### Command profile chuan

```bash
python -m pytest tests/unit -q
python -m pytest tests/integration -q
python -m pytest tests/e2e -q
python -m pytest tests/observability -q
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test --workspace
cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo check --workspace
bash scripts/health_check.sh
bash scripts/compliance_audit.sh --check-correlation --check-versioning
python scripts/audit_correlation.py --fail-on-findings
```

### Scenario bat buoc

1. Full regression rerun pass `100%`.
2. Release gate `controlled live ready` pass.
3. Rollback readiness rehearsal pass `100%`.
4. P0 open `=0`, P1 unowned `=0`.
5. Correlation/compliance audits pass (`0 findings`).
6. Gate artifacts cuoi ky nhat quan hoan toan.
7. Final approval da chot bang evidence ID hop le.

### Rule test ownership

1. Test phan anh hanh vi codebase hien tai.
2. Khi thay doi hop le theo spec, test cap nhat cung tuan va co evidence.
3. Cam sua production code chi de chieu test loi thoi.

## 5.1) Gate Checklist (Nhip W24)

Su dung truc tiep [CHECKLIST_GATE_W01_W24.md](CHECKLIST_GATE_W01_W24.md) cho cac dau muc bat buoc.

- Evidence ID W24: `EV-W24-###`
- Interface/type change (neu co) bat buoc co `CR-W24-###`.

---

## 6) Mau bao cao cuoi tuan

1. Executive Summary.
2. KPI Snapshot.
3. Delivery Status theo `W24-T01..W24-T18`.
4. Issue Register snapshot.
5. Rehearsal results (full regression, release gate, rollback readiness, governance).
6. Final Gate Decision (`GO/NO-GO`) voi evidence.
7. Controlled Live Ready Signoff hoac Recovery Queue cuoi.

---

## 7) KPI dictionary W24

### Release Quality

- Full Regression Rerun Pass Rate.
- Controlled Live Ready Gate Pass Rate.
- Final Approval Completeness.
- Release Blocker Open Count.

### Reliability

- P0 Open Count.
- P1 Unowned Count.
- W09-W23 Regression Guard Pass Rate.
- Rollback Readiness Pass Rate.

### Alert & Observability

- Correlation Coverage.
- Compliance Findings Count.

### Engineering Quality

- Change Budget Compliance.
- Regression Count Sau Rerun.

### Governance

- Artifact consistency.
- Evidence completeness.
- Final approval status.

---

## 8) Assumptions & defaults

- W24 la release hard-gate cuoi, khong mo refactor lon.
- One-ID policy giu nguyen: `correlation_id`.
- Khong doi wire-shape cong khai neu khong co trigger P0/P1 risk.
- Khong ghi `Done/Pass/GO` khi thieu evidence ID hop le.
- Neu mot muc bat buoc fail o rerun cuoi: giu `NO-GO` + recovery queue co owner/ETA.
- Neu can doi API/interface de dong release gate, phai mo `CR-W24-001`; uu tien adapter/compatibility truoc.

---

## 9) Execution artifacts (Week 24)

- [week24/KPI_CHARTER_WEEK24.md](week24/KPI_CHARTER_WEEK24.md)
- [week24/FINAL_PHASE_GATE4_BASELINE_REPORT.md](week24/FINAL_PHASE_GATE4_BASELINE_REPORT.md)
- [week24/FINAL_PHASE_GATE4_IMPLEMENTATION_PLAN.md](week24/FINAL_PHASE_GATE4_IMPLEMENTATION_PLAN.md)
- [week24/ISSUE_REGISTER_WEEK24.md](week24/ISSUE_REGISTER_WEEK24.md)
- [week24/INTERFACE_RELEASE_GATE4_SPEC.md](week24/INTERFACE_RELEASE_GATE4_SPEC.md)
- [week24/GATE_REHEARSAL_NOTES.md](week24/GATE_REHEARSAL_NOTES.md)
- [week24/WEEK24_FINAL_REPORT_AND_CONTROLLED_LIVE_READY_SIGNOFF.md](week24/WEEK24_FINAL_REPORT_AND_CONTROLLED_LIVE_READY_SIGNOFF.md)

---

## 10) Execution status (current)

- `W24-T01..T18`: `DONE` with recovery queue.
- Command profile: `CAPTURED_PASS` for direct W24 Python/Rust/compliance/correlation checks.
- Scenario/hardening matrix: `CAPTURED_PASS` for controlled-live-ready, release blocker closure, final approval, and regression guard.
- Final gate: `GO`; controlled-live-ready signoff locked.
