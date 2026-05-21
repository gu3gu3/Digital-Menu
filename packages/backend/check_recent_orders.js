const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.orden.count();
  console.log("Total orders:", count);
  
  const recentOrders = await prisma.orden.findMany({
    where: {
      createdAt: {
        gte: new Date('2026-05-01')
      }
    }
  });
  console.log(`Orders since May 1, 2026: ${recentOrders.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
