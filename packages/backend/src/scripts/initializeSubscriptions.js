const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Script para inicializar suscripciones para restaurantes existentes
 * y crear el primer super usuario
 */
async function initializeSubscriptions() {
  try {
    console.log('🚀 Iniciando inicialización de suscripciones...');

    // 1. Crear super usuario inicial si no existe
    const existingSuperUser = await prisma.superUsuario.findFirst();
    
    if (!existingSuperUser) {
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
      
      const superUser = await prisma.superUsuario.create({
        data: {
          email: 'admin@menuview.app',
          password: hashedPassword,
          nombre: 'Super',
          apellido: 'Administrador'
        }
      });
      
      console.log('✅ Super usuario creado:', superUser.email);
    } else {
      console.log('ℹ️  Super usuario ya existe:', existingSuperUser.email);
    }

    // 2. Obtener todos los restaurantes sin suscripción
    const restaurantesSinSuscripcion = await prisma.restaurante.findMany({
      where: {
        suscripcion: null
      },
      include: {
        plan: true
      }
    });

    console.log(`📊 Encontrados ${restaurantesSinSuscripcion.length} restaurantes sin suscripción`);

    // 3. Crear suscripciones para restaurantes existentes
    for (const restaurante of restaurantesSinSuscripcion) {
      // Calcular fecha de vencimiento (15 días desde hoy para plan gratuito, 1 mes para otros)
      const fechaVencimiento = new Date();
      
      if (restaurante.plan.precio === 0) {
        fechaVencimiento.setDate(fechaVencimiento.getDate() + 15); // 15 días
      } else {
        fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1); // 1 mes
      }

      const suscripcion = await prisma.suscripcion.create({
        data: {
          restauranteId: restaurante.id,
          planId: restaurante.planId,
          estado: 'ACTIVA',
          fechaInicio: new Date(),
          fechaVencimiento,
          mesesPagados: 1,
          notasAdmin: 'Suscripción inicial creada automáticamente'
        }
      });

      console.log(`✅ Suscripción creada para ${restaurante.nombre} (${restaurante.plan.nombre})`);

      // Crear notificación de bienvenida
      await prisma.notificacionUsuario.create({
        data: {
          restauranteId: restaurante.id,
          tipo: 'BIENVENIDA',
          titulo: '¡Bienvenido al Sistema de Suscripciones!',
          mensaje: `Su suscripción al plan ${restaurante.plan.nombre} está activa hasta ${fechaVencimiento.toLocaleDateString()}. Puede revisar los detalles de su suscripción en el panel de administración.`
        }
      });
    }

    // 4. Mostrar estadísticas finales
    const estadisticas = await prisma.suscripcion.groupBy({
      by: ['estado'],
      _count: {
        id: true
      }
    });

    console.log('\n📈 Estadísticas de suscripciones:');
    estadisticas.forEach(stat => {
      console.log(`   ${stat.estado}: ${stat._count.id} suscripciones`);
    });

    const totalSuscripciones = await prisma.suscripcion.count();
    console.log(`   TOTAL: ${totalSuscripciones} suscripciones`);

    console.log('\n🎉 Inicialización completada exitosamente!');
    console.log('\n📝 Credenciales del Super Usuario:');
    console.log('   Email: admin@menuview.app');
    console.log('   Password: SuperAdmin123!');
    console.log('\n🔗 Endpoints disponibles:');
    console.log('   POST /api/super-admin/auth/login');
    console.log('   GET  /api/super-admin/subscriptions');
    console.log('   GET  /api/super-admin/subscriptions/stats');

  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script si se llama directamente
if (require.main === module) {
  initializeSubscriptions()
    .then(() => {
      console.log('✅ Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { initializeSubscriptions }; 