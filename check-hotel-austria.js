const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkHotelAustria() {
  try {
    console.log('🔍 Buscando Hotel Austria...');
    
    // Buscar Hotel Austria
    const hotelAustria = await prisma.restaurante.findFirst({
      where: {
        nombre: {
          contains: 'Hotel Austria',
          mode: 'insensitive'
        }
      },
      include: {
        suscripcion: true,
        plan: true,
        usuariosAdmin: true
      }
    });

    if (!hotelAustria) {
      console.log('❌ Hotel Austria no encontrado');
      return;
    }

    console.log('✅ Hotel Austria encontrado:');
    console.log(`   ID: ${hotelAustria.id}`);
    console.log(`   Nombre: ${hotelAustria.nombre}`);
    console.log(`   Slug: ${hotelAustria.slug}`);
    console.log(`   Plan ID: ${hotelAustria.planId}`);
    console.log(`   Plan: ${hotelAustria.plan?.nombre || 'NO ENCONTRADO'}`);
    console.log(`   Suscripción: ${hotelAustria.suscripcion ? 'SÍ' : 'NO'}`);
    console.log(`   Admins: ${hotelAustria.usuariosAdmin.length}`);

    if (!hotelAustria.suscripcion) {
      console.log('\n🛠️  Creando suscripción para Hotel Austria...');
      
      const fechaInicio = new Date();
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaInicio.getDate() + 30); // 30 días

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
      console.log(`   Válida hasta: ${suscripcion.fechaVencimiento.toLocaleDateString()}`);
    } else {
      console.log('✅ Hotel Austria ya tiene suscripción activa');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkHotelAustria(); 