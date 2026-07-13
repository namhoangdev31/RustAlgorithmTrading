import "dotenv/config";
import { prisma } from "@/lib/server/prisma";

async function main() {
  if (!process.argv.includes("--confirm-reset-lepoship")) {
    throw new Error("Refusing reset. Pass --confirm-reset-lepoship explicitly.");
  }
  if (process.env.NODE_ENV === "production") throw new Error("LepoShip reset is forbidden in production.");
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND (tablename LIKE 'bundle_%' OR tablename LIKE 'lepoship_%')
    ORDER BY tablename
  `;
  if (!tables.length) throw new Error("No LepoShip tables were found.");
  const names = tables.map(({ tablename }) => `"public"."${tablename.replaceAll('"', '""')}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`);
  console.info(`Reset ${tables.length} LepoShip tables. User, project and workspace tables were preserved.`);
}

main().finally(() => prisma.$disconnect());
