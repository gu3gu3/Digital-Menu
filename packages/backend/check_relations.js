const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rest = await prisma.restaurante.findUnique({
    where: { slug: 'el-nica-guate-gt' },
    include: {
      sponsors: true
    }
  });
  console.log(JSON.stringify(rest.sponsors, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
