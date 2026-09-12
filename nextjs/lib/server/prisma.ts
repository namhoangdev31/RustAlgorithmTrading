import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/generated/client";

// Force Next.js HMR to reload the Prisma Client schema metadata
if (process.env.NODE_ENV !== "production") {
  (globalThis as any).prisma = undefined;
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.LEPOS_DATABASE_URL ||
    process.env.LEPOS_POSTGRES_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL or LEPOS_DATABASE_URL is required to initialize Prisma.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
