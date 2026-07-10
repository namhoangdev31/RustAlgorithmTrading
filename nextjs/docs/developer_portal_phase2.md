# Developer Portal Phase 2 — Architecture & Re-engineering Documentation

Phase 2 transitions the Developer Portal from simulated dashboard pages into a robust, real-data-driven project/workspace management application built on Next.js 16 (Turbopack), Prisma, Server Components, and Server Actions.

---

## 1. Core Architecture Changes

- **Route Ownership**: Redirects and legacy dashboard forward wrappers have been fully decoupled. Each tab has been extracted into a standalone Server Component page loader under a clean sub-folder structure.
- **Portal Shell Layout**: Replaced ad-hoc layout styles with a global unified `PortalShell`, `PortalSidebar`, `PortalHeader`, and `PortalPage` container system using standard tailwind custom radius and HSL palette styles.
- **Database Persistence**: Added Prisma backing models (e.g. `LepoShipBuild`, `MarketplaceCompatibilityRun`, `ProjectMembership`, `WorkspaceProviderConnection`, etc.) to get rid of simulated mock datasets.

---

## 2. Project Sub-Routes Layout

Each project under `/projects/[projectId]` now maps to the following modular structure:

1. **Overview**: Active deployments browser previews, metadata stats, and Git repository info.
2. **Deployments**: Production and preview deployment histories fetched directly via Vercel clients.
3. **Delivery**: Release tracks, app delivery rules, and target distribution channels.
4. **Domains**: Custom domains configuration and active Vercel alias assignments.
5. **Observability**: Real-time error analytics feeds, vitals, and Speed Insights metrics.
6. **Routing**: WAF rules, middleware mappings, and path rewrites.
7. **Security**: SSL certs status, IP rate limit filters, and firewall configurations.
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

## 4. Verification & Compilation

All pages compile with **zero typescript compile errors**:
```bash
yarn typecheck  # Passed
yarn build      # Succeeded
```
