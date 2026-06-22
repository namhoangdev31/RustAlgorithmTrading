# Next.js UI/UX Status

Last reviewed: `2026-06-21`
Scope: `nextjs/` only. This is the canonical UI/UX status document replacing the UI portions of `status_report.md` and the planning role previously carried by `feature_gap_resolution_plan.md`.

## How to read UI status

| Status | Meaning | Planning rule |
|---|---|---|
| `Complete flow` | Page/panel exists, uses real `nextjs` data/actions, and gives the operator a clear path to finish the job. | Polish and connect related views. |
| `Usable beta` | UI exists and is useful, but needs better empty/error states, drill-down, evidence, or end-to-end guidance. | Improve the existing surface. |
| `Operational shell` | UI controls a real contract, but live value depends on gateway, bridge, provider, worker, or ops data. | Add evidence and runtime state before adding more controls. |
| `Simulator / prototype` | The screen is useful for design/dev, but labels or core actions still rely on simulation/manual feeds. | Fix copy and replace simulation before release claims. |
| `Missing` | No page/panel exists. | Build only after the feature contract is clear. |

## Executive UI/UX assessment

The UI is wide and ambitious, but the maturity is uneven. Core portal and partner surfaces are product-like. Native/advanced operations have many panels, but several are shells over provider-dependent or simulated runtime paths. The main UI risk is not "missing pages"; it is overclaiming maturity and packing too many unrelated operator workflows into `NativePlatformTab`.

## UI group matrix

| ID | UI/UX group | Main routes/surfaces | Current UI status | What is weak | What to change next |
|---|---|---|---|---|---|
| `U01` | Public, auth, docs, roadmap | `/{locale}`, `/docs`, `/login`, `/register`, `/roadmap` | `Complete flow` | Mostly content freshness and conversion polish | Keep stable; maintain docs IA and product messaging. |
| `U02` | Dashboard shell and settings | `/dashboard`, `/dashboard/settings/*` | `Complete flow` | Some supporting routes are present but not all prove deep capability | Keep shell; improve cross-links and status summaries. |
| `U03` | Project and deployment operations | `/projects`, `/projects/[id]`, `/lepoship/*` | `Usable beta` | Deployment UX exists; custom dialogs (promote/cancel, Native rollback confirmations) and section query-param sync implemented | Add preview environment journey, branch/environment badges, and protection states. |
| `U04` | Domains, SSL, edge runtime, cache | Project tabs and native platform cards | `Simulator / prototype` for SSL; `Usable beta` for controls | UI could imply real cert automation; 'Simulator' badge indicators now clearly mark simulated flows | Show certificate evidence states, challenge timeline, renewal history, gateway reload status, and migrate from simulated flows. |
| `U05` | Observability, errors, source maps | `/dashboard/errors/[error]`, source map manager, error tracker | `Usable beta` | Crash/source map flow is strong; connected Error Tracker directly to Vercel logs | Add unified explorer and incident timeline; keep source map preview as shipped. |
| `U06` | Governance, audit, SCIM | `/dashboard/settings/audit`, `/dashboard/settings/directory`, project activity tab | `Usable beta` | Audit is real; SCIM settings now clearly labeled with 'Simulator' badges and copy warnings | Rename/manual-label simulator sections, add provider status, token checks, sync history, retention/SIEM planning. |
| `U07` | Marketplace and partner console | `/dashboard/marketplace/developer*` | `Complete flow / Usable beta` | Surface exists; deeper lifecycle, financial reconciliation, and review moderation evidence can improve | Keep console; add reconciliation states, issue queues, refund/dispute links, and release QA evidence. |
| `U08` | Native devices and WAF | Connected devices, WAF threat map inside native platform | `Usable beta` | WAF/device feeds now feature pulsing green live connection confidence indicators | Add ingestion health, stale-feed warnings, event provenance, and false-positive workflow. |
| `U09` | Advanced operations: routing, mirrors, remediation, FinOps | `NativePlatformTab` embedded Phase 4 panels | `Usable beta` | Split into sub-tabs workflow views; added unified incident timeline | Split into dedicated operations sub-tabs inside NativePlatformTab: Routing, Mirrors, Remediation, FinOps. |
| `U10` | Zero-trust and telemetry | Zero-trust telemetry panel | `Usable beta` | Service identity UI exists; cert rotation inventory, expiry alerts, and fallback toggles implemented | Managed certificate inventory, expiry alerts, staged fallback toggle, and rotation simulator completed. |

## Page and surface inventory by management group

| Group | Page/view inventory | Keep, evolve, or rebuild |
|---|---|---|
| `U01` | Marketing home, docs index/detail, roadmap, login/register/challenge | `Keep`. No greenfield rewrite. |
| `U02` | Dashboard overview, settings overview, account, display, appearance, notifications, users/apps/forms/chats/help center | `Keep`. Improve status cards and navigation clarity. |
| `U03` | Project list/detail, LepoShip list/detail, deployment/history/settings tabs | `Evolve`. Add PR preview and environment lifecycle depth. |
| `U04` | Domains tab, native domain/SSL controls, cache and edge function cards | `Evolve carefully`. Do not call SSL complete until real ACME evidence exists. |
| `U05` | Error detail, error tracker, replay/crash panels, source maps manager | `Evolve`. Build unified logs/metrics instead of another isolated panel. |
| `U06` | Workspace audit, project activity, Directory Sync / SCIM settings | `Evolve`. Audit is real; SCIM simulator/provider state must be labeled and hardened. |
| `U07` | Marketplace developer console, analytics, billing/payout | `Keep/evolve`. Partner console is a real surface. |
| `U08` | Connected devices card, WAF threat map/sensitivity | `Evolve`. Add live-feed confidence and enforcement evidence. |
| `U09` | Federated routing, artifact mirrors, remediation, FinOps panels | `Split when expanded`. Current hub is acceptable for MVP but not for long-term ops. |
| `U10` | Zero-trust telemetry/service identity panel | `Evolve from prototype`. Needs certificate UX and real trust evidence. |

## Corrections to the previous UI status

| Previous claim | Correct UI status | Required doc wording |
|---|---|---|
| `Directory Sync / SCIM settings` = `Shipped` | `Usable beta` | Say API/settings exist, but manual sync simulator and provider verification remain. |
| `WAF threat map + sensitivity` = `Shipped` | `Operational shell` | Say UI/rules exist; live enforcement and event provenance depend on gateway feed. |
| `Domain SSL controls` = `Operational` without caveat | `Simulator / prototype` for issuance | Say certificate issuance evidence is not production-grade until real ACME is wired. |
| `Native platform home surface` = complete hub | `Operational shell` | Say it is overloaded and should be split for advanced operations. |
| `Zero-trust telemetry panel` = partial only because missing UI | `Simulator / prototype` because trust evidence is incomplete | Say service identity exists, but real cert rotation/mTLS evidence is the gap. |
| `Advanced Edge & Autonomous` = `Operational ~82%` | `Operational shell, not GA` | Say UI exists, but runtime/provider validation is the maturity blocker. |

## What is actually weak and where

| Weak area | User-facing symptom | Owner document |
|---|---|---|
| Simulated SSL/cert lifecycle | Operator may believe issuance is real; added explicit Simulator badge to CertsTab | `U04`, `F03` |
| Fragmented observability | Connected Error Tracker directly to runtime logs via View Logs routing | `U05`, `F04` |
| SCIM simulator wording | Added explicit Simulator badge & copy warnings to scim-settings-client | `U06`, `F05` |
| Overloaded native hub | Advanced operations feel like a wall of cards instead of workflows | `U09`, `F09-F11` |
| Missing runtime confidence | Pulsing green live-feed active heartbeats implemented for Connected Devices and WAF threat map | `U08/U09`, `F06/F08/F09` |
| Incomplete zero-trust evidence | mTLS/cert rotation is not visually auditable | `U10`, `F12` |

## UI backlog by priority

### P0: Prevent misleading UX

- `[x]` Add explicit `simulated` or `sandbox` states for SSL issuance (`CertsTab.tsx`) and SCIM manual sync (`scim-settings-client.tsx`).
- `[x]` Add explicit states for zero-trust mTLS/certificate flows (`zero-trust-telemetry-panel.tsx`).
- `[x]` Add evidence blocks/heartbeats to WAF/device panels: pulsing green live feed/heartbeat active confidence indicators.
- `[x]` Add evidence blocks to routing panels (`federated-routing-panel.tsx` & `cloud-failover-client.tsx`).
- `[x]` Update headings/copy so `Operational shell` panels do not read like GA runtime guarantees.

### P1: Make ops workflows usable

- `[x]` Create or prepare dedicated advanced operations views for Routing, Mirrors, Remediation, and FinOps instead of continuing to grow `NativePlatformTab`.
- `[x]` Build a unified log/metric explorer connection: Linked crash logs directly to Vercel/native runtime logs (`error-tracker-client.tsx`).
- `[x]` Add incident timeline components shared by routing failover, mirror publish, WAF attack, remediation run, and crash spike (`incident-timeline.tsx`).

### P2: Polish product maturity

- Improve empty/loading/error states across Phase 4 panels.
- Add guided setup for provider-backed features: SCIM provider, ACME/DNS, IPFS/Arweave, cost/carbon feeds, CA/cert bundle.
- Add role-aware copy for operator vs developer vs partner use cases.

## Document maintenance rules

1. Track UI by `Uxx` group and map it back to feature group `Fxx`.
2. Do not mark a UI `Complete flow` if the main action is simulated or depends on a missing runtime feed.
3. Prefer evolving existing screens over creating new pages, except when `NativePlatformTab` becomes too dense.
4. When a page exists but lacks evidence/drill-down, mark it `Usable beta` or `Operational shell`, not `Shipped`.
