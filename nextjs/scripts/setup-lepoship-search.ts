import "dotenv/config";
import { prisma } from "../lib/server/prisma";

const statements = [
  `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
  `CREATE INDEX IF NOT EXISTS bundles_name_trgm_idx ON bundles USING gin (name gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS bundles_short_description_trgm_idx ON bundles USING gin (short_description gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS bundle_localizations_name_trgm_idx ON bundle_localizations USING gin (localized_name gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS bundle_search_keywords_keyword_trgm_idx ON bundle_search_keywords USING gin (keyword gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS bundle_tags_tag_trgm_idx ON bundle_tags USING gin (tag gin_trgm_ops)`,
];

async function main() {
  for (const statement of statements) await prisma.$executeRawUnsafe(statement);
}

main().finally(() => prisma.$disconnect());
