import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.bfxpsTradingPlan.count();
  console.log('Total records:', count);
  const filled = await prisma.bfxpsTradingPlan.count({
    where: { status: { not: 'PENDING' }, exitType: { not: 'NO_FILL' } }
  });
  console.log('Filled records:', filled);
}
main().catch(console.error).finally(() => prisma.$disconnect());
