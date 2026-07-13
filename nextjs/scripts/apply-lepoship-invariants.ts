import "dotenv/config";
import { prisma } from "@/lib/server/prisma";

const statements = [
  `ALTER TABLE bundles DROP CONSTRAINT IF EXISTS bundles_delivery_mode_check`,
  `ALTER TABLE bundles ADD CONSTRAINT bundles_delivery_mode_check CHECK (
    (active_delivery_mode = 'none' AND active_ab_test_id IS NULL AND active_rollout_id IS NULL)
    OR (active_delivery_mode = 'experiment' AND active_ab_test_id IS NOT NULL AND active_rollout_id IS NULL)
    OR (active_delivery_mode = 'rollout' AND active_ab_test_id IS NULL AND active_rollout_id IS NOT NULL)
  )`,
  `ALTER TABLE bundle_release_overrides_v2 DROP CONSTRAINT IF EXISTS bundle_release_overrides_expiry_check`,
  `ALTER TABLE bundle_release_overrides_v2 ADD CONSTRAINT bundle_release_overrides_expiry_check CHECK (expires_at > created_at AND expires_at <= created_at + interval '1 hour')`,
  `ALTER TABLE bundle_artifacts DROP CONSTRAINT IF EXISTS bundle_artifacts_delta_bounds_check`,
  `ALTER TABLE bundle_artifacts ADD CONSTRAINT bundle_artifacts_delta_bounds_check CHECK (
    (kind <> 'delta') OR (base_build_number IS NOT NULL AND target_build_number IS NOT NULL AND base_build_number < target_build_number)
  )`,
] as const;

async function main() {
  for (const statement of statements) await prisma.$executeRawUnsafe(statement);
  console.info(`Applied ${statements.length / 2} LepoShip database invariants.`);
}

main().finally(() => prisma.$disconnect());
