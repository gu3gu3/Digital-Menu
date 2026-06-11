const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const restaurante = await prisma.restaurante.findFirst({
    where: { 
      OR: [
        { slug: 'el-nica-guate-gt', activo: true },
        { slug: 'el-nica-guate', activo: true }
      ]
    },
    include: {
      sponsors: {
        where: { activo: true },
        select: {
          id: true,
          nombreEmpresa: true,
          logoUrl: true,
          campanas: {
            where: {
              activo: true,
              fechaInicio: { lte: new Date() },
              fechaFin: { gte: new Date() }
            },
            select: {
              id: true,
              nombre: true,
              splashImageUrl: true,
              bannerImageUrl: true,
              targetUrl: true,
              position: true
            }
          }
        }
      }
    }
  });

  console.log(JSON.stringify(restaurante.sponsors, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
