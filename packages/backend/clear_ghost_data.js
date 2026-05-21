const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Limpiando ordenes fantasmas de 2025...");
  const cutoffDate = new Date('2026-05-01');

  // Cancelar ordenes antiguas
  const updatedOrders = await prisma.orden.updateMany({
    where: {
      createdAt: { lt: cutoffDate },
      estado: { notIn: ['CANCELADA', 'COMPLETADA'] }
    },
    data: {
      estado: 'CANCELADA',
      updatedAt: new Date()
    }
  });
  console.log(`Ordenes antiguas canceladas: ${updatedOrders.count}`);

  // Cerrar sesiones antiguas
  const updatedSessions = await prisma.sesion.updateMany({
    where: {
      createdAt: { lt: cutoffDate },
      activa: true
    },
    data: {
      activa: false,
      finSesion: new Date()
    }
  });
  console.log(`Sesiones antiguas cerradas: ${updatedSessions.count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
