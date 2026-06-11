const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const restaurante = await prisma.restaurante.findFirst({
    where: { slug: 'el-nica-guate-gt', activo: true },
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

  const sponsorActivo = restaurante.sponsors?.length > 0 ? {
    nombreEmpresa: restaurante.sponsors[0].nombreEmpresa,
    logoUrl: restaurante.sponsors[0].logoUrl,
    campanas: restaurante.sponsors[0].campanas?.map(c => ({
      ...c,
      splashImageUrl: c.splashImageUrl,
      bannerImageUrl: c.bannerImageUrl
    })) || []
  } : null;

  console.log(JSON.stringify(sponsorActivo, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
