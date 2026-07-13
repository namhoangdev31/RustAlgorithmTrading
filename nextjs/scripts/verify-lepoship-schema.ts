import "dotenv/config";
import { validateLepoShipEnvironment } from "@/lib/server/lepoship/environment";
import { prisma } from "@/lib/server/prisma";

const requiredTables = [
  "bundle_releases", "bundle_channels", "bundle_artifacts", "bundle_build_jobs",
  "bundle_build_log_chunks", "bundle_release_approvals", "bundle_release_overrides_v2",
  "bundle_delivery_rollouts", "bundle_outbox_events", "lepoship_idempotency_keys",
  "bundle_ledger_accounts", "bundle_ledger_transactions", "bundle_ledger_entries",
  "bundle_stripe_webhook_events", "bundle_entitlement_licenses",
];
const requiredConstraints = [
  "bundles_delivery_mode_check", "bundle_release_overrides_expiry_check", "bundle_artifacts_delta_bounds_check",
];

async function main() {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  const constraints = await prisma.$queryRaw<Array<{ conname: string }>>`
    SELECT conname FROM pg_constraint WHERE connamespace = 'public'::regnamespace
  `;
  const tableNames = new Set(tables.map((row) => row.tablename));
  const constraintNames = new Set(constraints.map((row) => row.conname));
  const missingTables = requiredTables.filter((name) => !tableNames.has(name));
  const missingConstraints = requiredConstraints.filter((name) => !constraintNames.has(name));
  const environment = validateLepoShipEnvironment();
  if (missingTables.length || missingConstraints.length || !environment.valid) {
    throw new Error(JSON.stringify({ missingTables, missingConstraints, missingEnvironment: environment.missing }));
  }
  console.info("LepoShip schema and production environment probe passed.");
}

main().finally(() => prisma.$disconnect());
