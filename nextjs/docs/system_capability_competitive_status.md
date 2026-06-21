# System Capability And Competitive Status

Last reviewed: `2026-06-21`

Scope: `nextjs/` capability readiness and UI/page coverage, compared against public official documentation for Vercel, Railway, and Firebase Hosting/App Hosting. This document is the management view that ties `docs/feature_status.md` (`Fxx` groups) and `docs/uiux_status.md` (`Uxx` groups) together.

## Reading model

| Label | Meaning |
|---|---|
| `Product-ready` | Strong enough inside `nextjs` to evolve/polish without rebuilding. |
| `Beta` | Real surface exists, but missing depth, evidence, or full workflow polish. |
| `Control-plane` | `nextjs` contracts/UI exist; real maturity depends on runtime/provider/ops validation. |
| `Prototype` | A core success path is simulated, manually fed, or not cryptographically/runtime verified. |
| `Competitor strong` | Vercel/Railway/Firebase provide a mature first-party or tightly integrated workflow. |

## Short conclusion

Lepos is broad, not uniformly mature. It already looks like a developer-cloud control plane, but only a subset is product-ready: portal, audit, source maps, and partner console are strongest. Domains/SSL, advanced edge routing, mirrors, remediation, FinOps, and zero-trust need hardening because many paths are still simulation, manually fed, or provider/runtime dependent.

The practical rule: do not plan more pages just because a feature sounds missing. First check the `Fxx/Uxx` group. In many cases the UI exists, but the weak point is evidence, live data, provider adapter, or gateway enforcement.

## Management group health

| Feature group | UI group | Current Lepos status | Main weakness | Competitive pressure |
|---|---|---|---|---|
| `F01` Core Portal, workspace, settings | `U01/U02` | `Product-ready` | Polish and workspace data depth | Vercel/Railway/Firebase all have mature account/project consoles. |
| `F02` Deployments, build queue, previews | `U03` | `Beta` | PR preview/environment lifecycle is not first-class | High: Vercel previews, Railway PR environments, Firebase preview channels are strong. |
| `F03` Domains, SSL, edge runtime, cache | `U04` | `Prototype/Beta` | SSL ACME/cert flow is simulated; storage-backed edge code path still has mock fallback | Very high: domain/SSL/CDN is table stakes for all three competitors. |
| `F04` Observability, crashes, source maps | `U05` | `Beta` | No unified logs/metrics/incident explorer | High: Vercel and Railway have strong observability/log workflows; Firebase relies on Google Cloud/Firebase tooling. |
| `F05` Audit, SCIM, governance | `U06` | `Beta` | SCIM provider flow still has simulator/manual-sync parts | Medium-high: Vercel has enterprise audit/directory features; Firebase/GCP IAM is mature but outside Hosting UI. |
| `F06` Connected devices/runtime bridge | `U08` | `Control-plane` | Requires live bridge heartbeat and device identity hardening | Low direct pressure: competitors do not expose equivalent hosting-native device heartbeat UI. |
| `F07` Marketplace/partner monetization | `U07` | `Product-ready/Beta` | Ecosystem scale and financial reconciliation depth | Medium: Vercel Marketplace and Firebase Extensions are stronger ecosystems. |
| `F08` WAF/traffic security | `U08` | `Control-plane` | Enforcement/feed evidence from gateway is the blocker | High against Vercel Firewall; lower direct pressure against Railway/Firebase Hosting UI. |
| `F09` Federated routing/artifact mirrors | `U09` | `Control-plane` | Real probes, failover soak, provider-backed mirrors | Medium-high: Railway has multi-region replicas; Vercel has mature regions/failover patterns. |
| `F10` Autonomous remediation | `U09` | `Control-plane` | Approval gate, safe apply, rollback evidence need staging proof | Differentiator: not a direct competitor parity feature, but risky to overclaim. |
| `F11` FinOps/carbon scheduling | `U09` | `Control-plane` | Manual/provider-fed signals and narrow workload coverage | Differentiator: useful if real, but not a parity blocker. |
| `F12` Zero-trust/encrypted telemetry | `U10` | `Prototype/Control-plane` | mTLS is header-gated; certificate rotation UX/evidence missing | Enterprise pressure: competitors rely on managed platform security rather than this exact UX. |

## UI/page view inventory summary

| UI group | Existing page/view coverage | Verdict |
|---|---|---|
| `U01` Public/auth/docs | Marketing home, docs index/detail, roadmap, login/register/challenge | Adequate. Keep content fresh. |
| `U02` Dashboard/settings | Dashboard overview, settings pages, account/display/appearance/notification, users/apps/forms/help surfaces | Adequate. Improve navigation/status summaries. |
| `U03` Project/deployment ops | Project list/detail, deployment tabs, LepoShip list/detail | Usable, but preview workflow parity is weak. |
| `U04` Domains/SSL/edge | Domain/SSL/cache/edge cards and controls | Needs honest simulation labels and real certificate evidence. |
| `U05` Observability/debugging | Error detail, tracker, source maps, replay/crash panels, speed insights | Strong pieces, weak unified investigation flow. |
| `U06` Governance | Workspace audit, project activity, directory sync/SCIM settings | Audit is strong; SCIM needs provider-state hardening. |
| `U07` Marketplace | Developer console, analytics, billing/payout | Good base; deepen reconciliation/lifecycle. |
| `U08` Devices/WAF | Connected devices, WAF threat map/sensitivity | Needs feed-health and enforcement evidence. |
| `U09` Advanced operations | Routing, mirrors, remediation, FinOps panels inside native hub | Good MVP shell; should split when expanding. |
| `U10` Zero-trust | Service identity/trust/telemetry panel | Prototype until cert rotation and real mTLS evidence exist. |

## Competitor comparison by capability

| Capability | Lepos today | Vercel | Railway | Firebase Hosting / App Hosting |
|---|---|---|---|---|
| Deploy, rollback, build workflow | `Beta`; build/deploy surfaces exist but PR preview lifecycle is weak | `Competitor strong`; deployment workflow is a core product area | `Competitor strong`; services/environments/deploy actions are core | `Competitor strong`; Hosting release history and App Hosting rollout are first-party |
| Preview/PR environments | `Partial`; needs standardized ephemeral env flow | `Competitor strong`; preview deployment workflow is central | `Competitor strong`; PR environments are first-party | `Competitor strong`; preview channels are first-party |
| Domains, SSL, CDN/edge delivery | `Prototype/Beta`; UI exists but SSL automation is simulated | `Competitor strong`; domain/CDN/SSL is table stakes | `Native`; custom domains/SSL/networking are first-party | `Competitor strong`; CDN and SSL are core Hosting features |
| Logs/metrics/observability | `Beta`; strong feature panels but no unified explorer | `Competitor strong`; Observability is a dedicated product area | `Competitor strong`; logs and metrics are first-party | `Adjacent/strong`; Cloud Logging/Firebase Performance sit around Hosting |
| Error tracking/source maps | `Beta/Product-ready`; strong source map manager and source excerpt fallback | `Adjacent`; commonly paired with observability/integrations | `Adjacent`; usually logs/OpenTelemetry/vendor tools | `Adjacent`; Crashlytics exists in Firebase ecosystem |
| Audit/governance/directory | `Beta`; audit is real, SCIM still needs provider hardening | `Competitor strong` for enterprise audit/directory features | `Native/plan-dependent` governance | `Adjacent`; IAM/audit via Google Cloud layer |
| WAF/security controls | `Control-plane`; needs gateway enforcement evidence | `Competitor strong`; Vercel Firewall/WAF is mature | `Not evidenced` as equivalent customer-managed WAF surface | `Not evidenced` as Hosting-native WAF control UI |
| Multi-region/failover | `Control-plane`; policy/snapshots exist, runtime proof needed | `Competitor strong`; mature region/failover platform patterns | `Competitor strong`; multi-region replicas documented | `Native/adjacent`; global CDN strong, compute routing less operator-controlled |
| Marketplace/publisher ecosystem | `Product-ready/Beta`; console exists, ecosystem still small | `Competitor strong`; Marketplace/integrations are mature | `Native/basic`; templates/deployables more than full partner billing | `Competitor strong`; Extensions publisher lifecycle is mature |
| Decentralized mirrors | `Control-plane`; provider publish needs validation | `Not evidenced` first-party | `Not evidenced` first-party | `Not evidenced` first-party |
| Auto-remediation | `Control-plane`; differentiated but risky before staging proof | `Adjacent`; platform-managed infra rather than operator run surface | `Native/basic`; restarts/redeploys but not closed-loop evidence UX | `Adjacent`; Google Cloud tooling around managed infra |
| FinOps/carbon scheduling | `Control-plane`; differentiated but narrow/manual-fed today | `Adjacent`; usage/cost tools, not carbon-aware scheduler UI | `Adjacent`; metrics/scheduling primitives, not equivalent | `Adjacent`; billing/carbon tooling via Google Cloud |
| Zero-trust/encrypted telemetry | `Prototype/Control-plane`; registry/envelopes exist, mTLS/cert UX weak | `Managed security strong`, but not this exact operator model | `Adjacent`; networking/platform identity features | `Adjacent`; IAM/Secret Manager/Cloud security ecosystem |

## Weakness map and what to fix

### P0: Parity blockers

| Blocker | Why it matters | Fix target |
|---|---|---|
| Preview/PR environment lifecycle is not first-class | Competitors make preview URLs, logs, and promotion feel automatic | `F02/U03` |
| SSL/certificate flow is simulated | Domain + SSL is a trust-critical baseline | `F03/U04` |
| Unified logs/metrics explorer is missing | Operators need one investigation path, not scattered panels | `F04/U05` |
| Gateway enforcement evidence is thin | WAF/routing claims require runtime proof | `F08/F09`, `U08/U09` |

### P1: Enterprise hardening

| Gap | Why it matters | Fix target |
|---|---|---|
| SCIM provider verification and sync history | Directory sync cannot rely on simulator language | `F05/U06` |
| Audit retention/SIEM/immutable export | Needed for enterprise governance parity | `F05/U06` |
| Cert rotation and mTLS rollout UX | Required before zero-trust is credible | `F12/U10` |
| Native hub overload | Advanced operators need task-focused workflows | `U09` |

### P2: Differentiators to prove

| Differentiator | Risk today | Proof needed |
|---|---|---|
| Artifact mirrors to IPFS/Arweave | Metadata exists, provider publish can fail or be unconfigured | Real adapter publish, retry, delete, gateway resolve/fallback tests. |
| Closed-loop remediation | Auto-apply is dangerous without strict gate/evidence | Staging dry-run, approval, apply, post-check, rollback audit. |
| FinOps/carbon scheduler | Manual/provider-fed signals limit trust | Provider adapters, explainable reschedule audit, broader workload coverage. |
| Encrypted/homomorphic telemetry | Expensive/complex and currently not full mTLS-backed | Feature flag, aggregate dashboard, latency/cost benchmark. |

## How to use this doc for future planning

1. Start with the `Fxx` group, not the old stage label.
2. If status is `Product-ready`, plan polish or depth, not greenfield rebuild.
3. If status is `Beta`, ask what evidence, workflow, or drill-down is missing.
4. If status is `Control-plane`, plan runtime/provider/ops validation before more UI.
5. If status is `Prototype`, do not write release notes or marketing copy that implies GA.

## Official competitor references

- [Vercel Deployments](https://vercel.com/docs/deployments)
- [Vercel Observability](https://vercel.com/docs/observability)
- [Vercel Firewall](https://vercel.com/docs/vercel-firewall)
- [Railway Environments](https://docs.railway.com/environments)
- [Railway Scaling](https://docs.railway.com/deployments/scaling)
- [Firebase Hosting preview and deploy](https://firebase.google.com/docs/hosting/test-preview-deploy)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)
