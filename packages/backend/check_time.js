const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [{ now }] = await prisma.$queryRaw`SELECT NOW()`;
  console.log("Database NOW():", now);
  console.log("Node NOW():", new Date());
}

main().catch(console.error).finally(() => prisma.$disconnect());
