const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixHotelAustria() {
  try {
    // Buscar Hotel Austria
    const hotelAustria = await prisma.restaurante.findFirst({
      where: {
        nombre: {
          contains: 'Hotel Austria',
          mode: 'insensitive'
        }
      }
    });

    if (!hotelAustria) {
      console.log('❌ Hotel Austria no encontrado');
      return;
    }

    console.log(`✅ Hotel Austria encontrado: ${hotelAustria.id}`);

    // Verificar si ya tiene suscripción
    const suscripcionExistente = await prisma.suscripcion.findUnique({
      where: {
        restauranteId: hotelAustria.id
      }
    });

    if (suscripcionExistente) {
      console.log('✅ Hotel Austria ya tiene suscripción');
      return;
    }

    // Crear suscripción
    const fechaInicio = new Date();
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaInicio.getDate() + 30);

    const suscripcion = await prisma.suscripcion.create({
      data: {
        restauranteId: hotelAustria.id,
        estado: 'ACTIVA',
        fechaInicio,
        fechaVencimiento,
        renovacionAutomatica: false
      }
    });

    console.log('✅ Suscripción creada exitosamente:');
    console.log(`   ID: ${suscripcion.id}`);
    console.log(`   Estado: ${suscripcion.estado}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixHotelAustria(); 