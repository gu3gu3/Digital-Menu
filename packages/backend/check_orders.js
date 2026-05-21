const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.orden.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      mesa: true,
    }
  });
  console.log("LAST 5 ORDERS:");
  orders.forEach(o => {
    console.log(`ID: ${o.id} | Estado: ${o.estado} | Creada: ${o.createdAt.toISOString()} | Mesa: ${o.mesa?.numero} | Notas: ${o.notas}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
