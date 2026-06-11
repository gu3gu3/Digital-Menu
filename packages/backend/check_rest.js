const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rests = await prisma.restaurante.findMany({
    select: { slug: true, nombre: true }
  });
  console.log(rests);
}
main().catch(console.error).finally(() => prisma.$disconnect());
