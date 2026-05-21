const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.orden.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      mesa: true,
      restaurante: true
    }
  });
  console.log("LAST 5 ORDERS:");
  orders.forEach(o => {
    console.log(`ID: ${o.id} | #Orden: ${o.numeroOrden} | Estado: ${o.estado} | Creada: ${o.createdAt.toISOString()} | Mesa: ${o.mesa?.numero} | RestId: ${o.restauranteId}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
