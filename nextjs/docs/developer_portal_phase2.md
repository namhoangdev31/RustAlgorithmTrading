# Developer Portal Phase 2 — Architecture & Re-engineering Documentation

Phase 2 transitions the Developer Portal from simulated dashboard pages into a robust, real-data-driven project/workspace management application built on Next.js 16 (Turbopack), Prisma, Server Components, and Server Actions.

---

## 1. Core Architecture Changes

- **Route Ownership**: Redirects and legacy dashboard forward wrappers have been fully decoupled. Each tab has been extracted into a standalone Server Component page loader under a clean sub-folder structure.
- **Portal Shell Layout**: Replaced ad-hoc layout styles with `PortalShell`, `PortalSidebar`, `PortalHeader`, `PortalPage`, shared states, tables, metrics, and semantic design tokens.
- **Database Persistence**: Added Prisma backing models (for example `LepoShipBuild`, `MarketplaceCompatibilityRun`, `ProjectMembership`, `WorkspaceProviderConnection`, and `WorkspaceAuditEvent`) so UI states have persisted or provider-backed evidence.

---

## 2. Project Sub-Routes Layout

Each project under `/projects/[projectId]` now maps to the following modular structure:

1. **Overview**: Active deployments browser previews, metadata stats, and Git repository info.
2. **Deployments**: Production and preview deployment histories fetched directly via Vercel clients.
3. **Delivery**: Persisted deployment artifacts and adapter-backed artifact mirrors.
4. **Domains**: Custom domains configuration and active Vercel alias assignments.
5. **Observability**: Persisted error analytics, vitals, replay, and empty states when telemetry is absent.
6. **Routing**: Routing policy, real replica state, and provider/heartbeat-backed cloud targets.
7. **Security**: WAF events, trust policies, identities, and connected-device evidence.
8. **Integrations**: Service registry catalog triggers and webhook dispatchers.
9. **Forms**: Native form capture endpoints, submissions list, and webhook forwarders.
10. **Members**: Project-level collaborator assignments and access privileges.
11. **Activity**: Project audits stream.
12. **Settings**: Environment variables, project renaming, and deletion triggers.

---

## 3. LepoShip Builds System

- **Build Tracking**: Persists enqueued builds into the `LepoShipBuild` table.
- **Execution Hook**: Spawns background tasks that update the status from `queued` to `building` and finally `success` or `failed`, recording live build logs and artifact paths.
- **OTA Updates**: Serves OTA assets via active check endpoints matching current compile releases.

---

## 4. Data Truth and Provider Boundaries

- Compatibility checks issue a bounded request to the registered endpoint, persist each run, and only mark an integration verified when every required check has evidence.
- Workspace provider credentials are encrypted, validated against GitHub, Vercel, Cloudflare, or Stripe before connection, and are removed together with their bindings on disconnect.
- SCIM credentials are workspace-scoped, encrypted, and returned only at creation/rotation. Directory resources are displayed only after a real SCIM request persists a mapping.
- Stripe, ACME, artifact mirror, storage replication, staging, and unsupported provider paths return an honest unavailable or failed state when credentials/adapters are absent. They do not synthesize success, certificates, CIDs, balances, targets, or QA outcomes.

## 5. Route and Component Matrix

| Scope | Canonical owner | Shared composition |
| --- | --- | --- |
| Workspace | `/overview`, `/projects`, `/deployments`, `/domains`, `/observability`, `/integrations`, `/activity` | `PortalShell`, `PageHeader`, `MetricCard`, `ResourceTable`, state components |
| Project | `/projects/[projectId]/{overview,deployments,delivery,domains,observability,routing,security,integrations,forms,members,activity,settings}` | Project route-specific surfaces; no Vercel or native mega-tab |
| LepoShip | `/lepoship/[projectId]/{overview,builds,ota,settings}` | Portal header, breadcrumbs, tables, dialogs |
| Marketplace | `/marketplace/{listings,analytics,billing}` | Persisted compatibility evidence and provider unavailable states |
| Settings | `/settings/{profile,workspace,members,security,notifications,appearance,directory,audit,tokens}` | Workspace membership, audit, provider, SCIM, and PAT primitives |

## 6. Maturity Evidence and Rollout Status

- Additive Phase 2 schema is deployed with a dual-read membership transition from legacy collaborators.
- Canonical routes contain direct Server Component read paths for forms and observability; mutations enforce workspace/project roles.
- The former Vercel mega-tab, incident simulation, cloud failover simulator, SCIM simulator, mocked Stripe flows, and generated analytics traffic are removed from portal reachability.
- Legacy `/dashboard/**` and `/projects/[id]` are intentionally not redirected as part of the breaking cleanup.

## 7. Verification & Compilation

All pages compile with **zero typescript compile errors**:
```bash
yarn typecheck  # Passed
yarn test:portal # Passed (membership and persisted data contracts)
yarn prisma validate # Passed
yarn build      # Succeeded
```

`git diff --check` is required before release. Browser smoke verifies canonical route access control at 375px and 1440px; an authenticated workspace session is required for page-content verification.
