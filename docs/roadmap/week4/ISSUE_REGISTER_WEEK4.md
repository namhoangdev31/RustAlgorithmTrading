# Issue Register Week 4 (Integration Stabilization)

## Board schema

- Flow: `NEW -> IN_PROGRESS -> BLOCKED -> DONE`
- Metadata bắt buộc: `issue_id`, `cluster`, `severity`, `owner`, `due`, `eta`, `status`, `dependency`, `mitigation`, `exit_criteria`, `evidence_id`, `blocking_of`
- Cluster chuẩn:
  - `A-Incompatibility`
  - `B-SemanticDrift`
  - `C-ObservabilityGap`

## Active issues

| Issue ID | Cluster | Severity | Owner | Due | ETA | Status | Dependency | Mitigation | Exit criteria | Evidence ID | Blocking of |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `W4-ISS-001` | B-SemanticDrift | P1 | `coder` | Pha 4 | done | `DONE` | carry-over `W3-ISS-008` | reproduce edge-case, khóa workaround | edge-case pass | `EV-W4-201` | Gate |
| `W4-ISS-002` | A-Incompatibility | P0 | `ops` | Pha 3 | done | `DONE` | reconnect hardening | disconnect drill pass | reconnect pass | `EV-W4-301` | Gate |
| `W4-ISS-003` | C-ObservabilityGap | P1 | `ops` | Pha 4 | done | `DONE` | logging chain audit | tăng coverage log context | 5 IDs trace pass | `EV-W4-205`,`EV-W4-304` | Gate |
| `W4-ISS-004` | A-Incompatibility | P1 | `ops` | Pha 3 | done | `DONE` | rollback drill | tối ưu runbook | rollback < 5 phút | `EV-W4-302` | Gate |
| `W4-ISS-005` | A-Incompatibility | P0 | `tester` | Pha 2 | done | `DONE` | baseline rerun | đóng blocker smoke | smoke >= 95% | `EV-W4-101..105` | Gate |
| `W4-ISS-006` | B-SemanticDrift | P2 | `planner` | Pha 5 | done | `DONE` | change budget control | giảm scope | budget compliance | `EV-W4-401` | Governance |
| `W4-ISS-007` | C-ObservabilityGap | P1 | `tester` | Pha 2 | done | `DONE` | compliance/source audit | fix findings | zero findings | `EV-W4-106..107` | Gate |
| `W4-ISS-008` | C-ObservabilityGap | P1 | `planner` | Pha 6 | done | `DONE` | artifact reconciliation | sync all docs | 1 decision `GO` | `EV-W4-206` | Gate |

## Gate blockers

- [x] Không còn P0 open.
- [x] Không còn evidence `CAPTURED_FAIL/BLOCKED_ENV` trong matrix bắt buộc.
- [x] Không còn P1 unowned.
- [x] Gate artifacts thống nhất một trạng thái cuối.

---
Last updated: 2026-04-23 (W4 Closeout)
