const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.sesion.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("LAST 5 SESSIONS:");
  sessions.forEach(s => {
    console.log(`ID: ${s.id} | Creada: ${s.createdAt.toISOString()} | Mesa: ${s.mesaId}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
