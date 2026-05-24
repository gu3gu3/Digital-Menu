const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Partner and Restaurants...');

  // 1. Create Partner "Agencia Difuso"
  const hashedPassword = await bcrypt.hash('password123', 10);
  const partner = await prisma.usuarioPartner.upsert({
    where: { email: 'agencia@difuso.com' },
    update: {},
    create: {
      email: 'agencia@difuso.com',
      password: hashedPassword,
      nombreAgencia: 'Agencia Difuso',
      nombreContacto: 'Juan Perez',
      telefono: '12345678',
      porcentajeComision: 50,
      activo: true
    }
  });

  console.log('Partner created:', partner.nombreAgencia);

  // 2. Fetch the "Plan Pro" or some plan
  const plan = await prisma.plan.findFirst({
    where: { nombre: { contains: 'Pro' } }
  });

  if (!plan) {
    console.error('No plan found to assign to restaurants.');
    return;
  }

  // 3. Create or Update Demo1 (Active commission, within 6 months)
  // Let's set it to 1 month ago
  const dateDemo1 = new Date();
  dateDemo1.setMonth(dateDemo1.getMonth() - 1);

  const demo1 = await prisma.restaurante.upsert({
    where: { slug: 'demo1' },
    update: {
      partnerId: partner.id,
      fechaAsignacionPartner: dateDemo1
    },
    create: {
      nombre: 'Demo1',
      slug: 'demo1',
      email: 'demo1@example.com',
      planId: plan.id,
      activo: true,
      partnerId: partner.id,
      fechaAsignacionPartner: dateDemo1
    }
  });

  console.log('Demo1 updated/created with date:', demo1.fechaAsignacionPartner);

  // 4. Create or Update Demo2 (Expired commission, older than 6 months)
  // Let's set it to 7 months ago
  const dateDemo2 = new Date();
  dateDemo2.setMonth(dateDemo2.getMonth() - 7);

  const demo2 = await prisma.restaurante.upsert({
    where: { slug: 'demo2' },
    update: {
      partnerId: partner.id,
      fechaAsignacionPartner: dateDemo2
    },
    create: {
      nombre: 'Demo2',
      slug: 'demo2',
      email: 'demo2@example.com',
      planId: plan.id,
      activo: true,
      partnerId: partner.id,
      fechaAsignacionPartner: dateDemo2
    }
  });

  console.log('Demo2 updated/created with date:', demo2.fechaAsignacionPartner);

  // Also create subscriptions for them so they show revenue
  await prisma.suscripcion.upsert({
    where: { restauranteId: demo1.id },
    update: { estado: 'ACTIVA' },
    create: {
      restauranteId: demo1.id,
      estado: 'ACTIVA',
      fechaInicio: new Date(),
      fechaVencimiento: new Date(new Date().setMonth(new Date().getMonth() + 1))
    }
  });

  await prisma.suscripcion.upsert({
    where: { restauranteId: demo2.id },
    update: { estado: 'ACTIVA' },
    create: {
      restauranteId: demo2.id,
      estado: 'ACTIVA',
      fechaInicio: new Date(),
      fechaVencimiento: new Date(new Date().setMonth(new Date().getMonth() + 1))
    }
  });

  console.log('Done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
