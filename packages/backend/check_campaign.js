const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const campanas = await prisma.campanaAnuncio.findMany({
    include: {
      sponsor: true
    }
  });
  console.log(JSON.stringify(campanas, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
