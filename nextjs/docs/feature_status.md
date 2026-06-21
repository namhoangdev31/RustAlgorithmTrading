# Next.js Feature Status

Last reviewed: `2026-06-21`
Scope: `nextjs/` only. This is the canonical feature maturity document replacing the feature portions of `status_report.md` and the backlog role previously carried by `feature_gap_resolution_plan.md`.

## How to read status

This document separates `UI/control-plane exists` from `GA end-to-end`. A capability can have schema, routes, actions, and panels in `nextjs` while still depending on runtime feeders, provider credentials, gateway behavior, or ops rollout before it is truly production-grade.

| Status | Meaning | Planning rule |
|---|---|---|
| `GA-ready in nextjs` | Persisted model, server logic, route/action, and operator UI are wired to non-mock data in `nextjs`. | Polish and scale; do not rebuild from scratch. |
| `Beta in nextjs` | Usable product surface exists, but needs hardening, drill-down, or workflow completeness. | Improve depth and evidence before calling it done. |
| `Control-plane ready` | `nextjs` owns schema/actions/UI, but real value requires a bridge, gateway, provider, worker, or ops script. | Validate cross-domain runtime before GA claims. |
| `Prototype / simulation` | A meaningful surface exists, but a core success path is mocked, simulated, or manually fed. | Replace the simulated path before marketing or GA. |
| `Missing` | No credible `nextjs` surface/contract found. | Build schema/contract before UI. |

## Executive correction

Lepos has broad feature coverage, but it is not uniformly complete. `Core Portal`, `Marketplace`, `Audit`, and `Source Maps` are close to product-ready inside `nextjs`; `Domains/SSL`, `Advanced Edge`, `Autonomous Ops`, `FinOps`, and `Zero-Trust` are mostly control-plane or prototype until the real provider/runtime paths are proven.

Do not treat `100% implemented in nextjs` as equivalent to `100% GA system`. For planning, use the group matrix below instead of stage-level optimism.

## Feature group matrix

| ID | Capability group | Stage anchor | Current maturity | Strongest evidence in `nextjs` | Weak point to manage | Next action |
|---|---|---:|---|---|---|---|
| `F01` | Core Portal, workspace, settings, members | `1` | `GA-ready in nextjs` | Dashboard shell, project/workspace routes, settings surfaces | Mostly polish/data depth, not missing product skeleton | Keep as maintenance/polish backlog. |
| `F02` | Deployments, build queue, preview workflow | `1/2` | `Beta in nextjs` | Project deployment tabs, LepoShip surfaces, build queue integration | No fully standardized Git-to-preview/PR environment comparable to Vercel/Railway/Firebase | Define preview environment contract, URL lifecycle, logs, promote/rollback flow. |
| `F03` | Domains, SSL, edge runtime, cache/CDN | `2` | `Prototype / simulation` for SSL; `Beta` for UI | Native domain controls, cache controls, edge function route/action surfaces | SSL issuance is simulated with mock cert material; S3/GS edge-function fetch path still has mock bytecode fallback | Replace ACME/DNS challenge mock, persist real cert evidence, wire real object storage fetch, show gateway reload/failure history. |
| `F04` | Observability, crashes, source maps, replay | `2/3` | `Beta in nextjs` | Error tracker, source map manager, real `sourcesContent` excerpt fallback | Missing unified logs/metrics explorer and incident timeline across deployment, region, WAF, remediation | Keep source maps as shipped; build cross-surface log/metric explorer next. |
| `F05` | Audit, SCIM, compliance governance | `3` | `Beta in nextjs` | Persisted project/workspace audit, CSV/JSON export, SCIM routes/settings | SCIM UI still includes manual sync simulator; compliance lacks retention, immutable export, SIEM streaming | Mark SCIM as beta, add provider verification/onboarding state, add audit retention/SIEM backlog. |
| `F06` | Connected devices and native runtime bridge | `2/3` | `Control-plane ready` | `NativeConnectedDevice`, heartbeat API, connected devices panel | Device life depends on bridge/runtime heartbeats and auth around device identity | Add bridge contract docs, auth/rate limits, last-session drill-down, and ingestion monitoring. |
| `F07` | Marketplace and partner monetization | `1/3` | `GA-ready/Beta in nextjs` | Developer console, analytics, release history, review summary, billing/payout pages | Ecosystem depth, real payment reconciliation, dispute/refund depth are still business/runtime concerns | Keep product surface; deepen reconciliation, partner QA, and lifecycle tooling. |
| `F08` | WAF and traffic security controls | `3/4` | `Control-plane ready` | Threat map, event table, sensitivity/rule controls | UI/rule config exists, but enforcement quality depends on gateway event feed and rule execution | Add enforcement evidence, managed-rule versioning, false-positive workflow, and attack timeline. |
| `F09` | Federated routing, replicas, artifact mirrors | `4` | `Control-plane ready` | Routing policies, region replicas, snapshots, mirror manager | Replicas can be seeded from cloud targets; real heartbeat/probe/gateway selection and provider mirror publish need validation | Require live heartbeat probes, gateway soak tests, adapter-backed IPFS/Arweave publish, and mirror failure history. |
| `F10` | Autonomous remediation and auto-healing | `4` | `Control-plane ready` | Remediation runs, dry-run/apply flow, audit/post-check fields | Approval gate and safe-apply semantics need hard enforcement before production auto-apply | Enforce approve-before-apply, require dry-run evidence, verify ops scripts in staging, add rollback drill-down. |
| `F11` | FinOps and carbon-aware scheduling | `4` | `Control-plane ready` | Scheduling policy, signals, build queue recommendation path | Signals are manually/provider-fed; coverage is mainly deferrable build queue jobs | Add cost/carbon adapters, explainability history, and coverage for deploy/background workloads. |
| `F12` | Service identity, zero-trust, encrypted telemetry | `4` | `Prototype / simulation` for mTLS; `Control-plane ready` for registry/envelopes | Service identity/trust policy models, telemetry envelope ingest | mTLS is header-gated, telemetry encryption depends on env key, certificate rotation UX is incomplete | Add real cert verification/rotation metadata, CA bundle lifecycle, fallback-disable staging gate, encrypted aggregate dashboards. |

## Stage health after grouping

| Stage | Honest `nextjs` maturity | Why the old estimate was risky | How to plan now |
|---|---|---|---|
| `Giai đoạn 1` Core Platform & Portal | `~88-92%` | Core screens are strong, but preview/deploy parity and partner ecosystem depth are not Vercel/Railway-level yet. | Treat `F01` as maintenance, `F02/F07` as beta hardening. |
| `Giai đoạn 2` Native Platform & Edge | `~65-75%` | Domains, SSL, edge runtime, devices, and WAF have UI/contracts, but several runtime paths are mock/provider-dependent. | Prioritize `F03`, then `F06/F08` evidence and ingestion. |
| `Giai đoạn 3` DX & AI DevOps | `~75-85%` | Audit/source maps are strong; SCIM simulator and missing unified observability reduce maturity. | Keep `F04/F05` as beta, not greenfield. |
| `Giai đoạn 4` Advanced Edge & Autonomous | `~45-60%` | Most surfaces are control-plane ready, not end-to-end proven under real gateway/provider/ops conditions. | Do not call `F09-F12` GA until runtime validation passes. |

## Corrections that must stay reflected in this doc

| Previous wording risk | Correct status | Reason |
|---|---|---|
| `Directory Sync / SCIM` as fully shipped | `Beta in nextjs` | SCIM API and mapping exist, but the UI still exposes manual sync simulation and provider onboarding/verification is shallow. |
| `Domain SSL` as shipped | `Prototype / simulation` | ACME/DNS challenge and certificate material are simulated in the server helper. |
| `Edge functions` as fully shipped | `Beta in nextjs` | HTTP code fetch can be real, but object-storage paths still include mock Wasm fallback. |
| `WAF` as shipped | `Control-plane ready` | Threat map/rules exist; enforcement and live gateway event quality must be proven. |
| `Artifact mirrors` as operational GA | `Control-plane ready` | Provider adapter env is required; failed publish can produce fallback metadata rather than a successful mirror. |
| `Auto-remediation` as closed-loop complete | `Control-plane ready` | Runs/actions exist, but approval gate, dry-run evidence, ops scripts, and rollback proof need staging validation. |
| `FinOps` as full scheduler | `Control-plane ready` | Current recommendation path uses available signals and build queue integration; provider feeds and wider workload classes remain. |
| `Zero-trust/mTLS` as shipped | `Prototype / simulation` for mTLS | Current enforcement relies on headers and metadata, not real client certificate verification/rotation. |

## What is strong enough to build on

- `F01` can be treated as stable portal foundation.
- `F04` source map manager and real source preview should be evolved, not rebuilt.
- `F05` audit log export/filtering is a real persisted flow; do not reintroduce synthetic audit timelines.
- `F07` partner console has enough surface area for incremental monetization depth.
- `F09-F12` have useful schemas and panels, which is valuable, but they need runtime proof before GA language.

## Canonical backlog by weakness

### P0: Avoid false GA claims

- Replace simulated SSL issuance with real ACME/DNS challenge evidence and certificate lifecycle history.
- Mark SCIM sync UI as sandbox/manual until a provider-verified sync flow exists.
- Add real mTLS/certificate rotation path or keep zero-trust labeled prototype.
- Add runtime enforcement evidence for WAF and routing decisions.

### P1: Close developer-platform parity gaps

- Build a unified log/metric explorer linked to deployment, environment, region, crash, WAF, and remediation records.
- Standardize Git/PR preview environments with URL lifecycle, protection, comments, logs, promote, and rollback.
- Split overloaded native operations into dedicated views once the hub becomes hard to operate.

### P2: Make differentiators GA

- Validate artifact mirrors with real IPFS/Arweave adapters and gateway fallback tests.
- Run remediation approve/apply/rollback through staging with immutable audit evidence.
- Add cost/carbon provider adapters and broaden scheduling beyond deferrable build jobs.
- Benchmark encrypted/homomorphic telemetry under feature flag before positioning it as production capability.

## Document maintenance rules

1. Update this file by `Fxx` group, not by vague stage labels.
2. A group may move to `GA-ready in nextjs` only when the main success path is not mock/simulation and has persisted evidence.
3. If the remaining work is in `go`, `ops`, provider env, or bridge/runtime feeds, keep the status `Control-plane ready`.
4. Use `docs/uiux_status.md` for page/surface readiness and this file for feature/runtime maturity.
