const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Seed unificado que crea:
 * 1. Planes del sistema
 * 2. Super usuario administrador
 * 3. Restaurantes demo con suscripciones
 * 4. Datos de prueba completos
 */
async function seedUnified() {
  try {
    console.log('🌱 Iniciando seed unificado del sistema...');
    console.log('=====================================');

    // ========================================
    // 1. CREAR PLANES DEL SISTEMA
    // ========================================
    console.log('\n📋 Creando planes del sistema...');
    
    const planEmprendedor = await prisma.plan.upsert({
      where: { nombre: 'Plan Emprendedor' },
      update: {
        precio: 6.00,
        limiteProductos: 30,
        limiteCategorias: 5,
        limiteMeseros: 2,
        limiteMesas: 10,
        limiteOrdenes: 400,
        soporteEmail: true,
        soporteChat: false,
        analiticas: false,
        activo: true
      },
      create: {
        nombre: 'Plan Emprendedor',
        precio: 6.00,
        limiteProductos: 30,
        limiteCategorias: 5,
        limiteMeseros: 2,
        limiteMesas: 10,
        limiteOrdenes: 400,
        soporteEmail: true,
        soporteChat: false,
        analiticas: false,
        activo: true
      }
    });

    const planCrecimiento = await prisma.plan.upsert({
      where: { nombre: 'Plan Crecimiento' },
      update: {
        precio: 20.00,
        limiteProductos: 150,
        limiteCategorias: 15,
        limiteMeseros: 6,
        limiteMesas: 20,
        limiteOrdenes: 1500,
        soporteEmail: true,
        soporteChat: false,
        analiticas: true,
        activo: true
      },
      create: {
        nombre: 'Plan Crecimiento',
        precio: 20.00,
        limiteProductos: 150,
        limiteCategorias: 15,
        limiteMeseros: 6,
        limiteMesas: 20,
        limiteOrdenes: 1500,
        soporteEmail: true,
        soporteChat: false,
        analiticas: true,
        activo: true
      }
    });

    const planPro = await prisma.plan.upsert({
      where: { nombre: 'Plan Pro' },
      update: {
        precio: 40.00,
        limiteProductos: 200,
        limiteCategorias: 30,
        limiteMeseros: 9999, // Ilimitado
        limiteMesas: 50,
        limiteOrdenes: 4000,
        soporteEmail: true,
        soporteChat: true,
        analiticas: true,
        activo: true
      },
      create: {
        nombre: 'Plan Pro',
        precio: 40.00,
        limiteProductos: 200,
        limiteCategorias: 30,
        limiteMeseros: 9999,
        limiteMesas: 50,
        limiteOrdenes: 4000,
        soporteEmail: true,
        soporteChat: true,
        analiticas: true,
        activo: true
      }
    });

    const planPlatinum = await prisma.plan.upsert({
      where: { nombre: 'Plan Platinum' },
      update: {
        precio: 80.00,
        limiteProductos: 9999,
        limiteCategorias: 9999,
        limiteMeseros: 9999,
        limiteMesas: 9999,
        limiteOrdenes: 9999,
        soporteEmail: true,
        soporteChat: true,
        analiticas: true,
        activo: true
      },
      create: {
        nombre: 'Plan Platinum',
        precio: 80.00,
        limiteProductos: 9999,
        limiteCategorias: 9999,
        limiteMeseros: 9999,
        limiteMesas: 9999,
        limiteOrdenes: 9999,
        soporteEmail: true,
        soporteChat: true,
        analiticas: true,
        activo: true
      }
    });

    console.log('✅ Planes creados exitosamente:');
    console.log(`   - ${planEmprendedor.nombre}: ${planEmprendedor.limiteProductos} productos, ${planEmprendedor.limiteOrdenes} órdenes, ${planEmprendedor.limiteMesas} mesas, ${planEmprendedor.limiteMeseros} meseros.`);
    console.log(`   - ${planCrecimiento.nombre}: ${planCrecimiento.limiteProductos} productos, ${planCrecimiento.limiteOrdenes} órdenes, ${planCrecimiento.limiteMesas} mesas, ${planCrecimiento.limiteMeseros} meseros.`);
    console.log(`   - ${planPro.nombre}: ${planPro.limiteProductos} productos, ${planPro.limiteOrdenes} órdenes, ${planPro.limiteMesas} mesas, ${planPro.limiteMeseros} meseros.`);
    console.log(`   - ${planPlatinum.nombre}: Ilimitado.`);

    // ========================================
    // 2. CREAR SUPER USUARIO ADMINISTRADOR
    // ========================================
    console.log('\n👑 Creando super usuario administrador...');
    
    const existingSuperUser = await prisma.superUsuario.findFirst({
      where: { email: 'admin@menuview.app' }
    });
    
    if (!existingSuperUser) {
      const hashedSuperPassword = await bcrypt.hash('SuperAdmin123!', 12);
      
      const superUser = await prisma.superUsuario.create({
        data: {
          email: 'admin@menuview.app',
          password: hashedSuperPassword,
          nombre: 'Super',
          apellido: 'Administrador',
        activo: true
      }
    });

      console.log('✅ Super usuario creado:');
      console.log(`   Email: ${superUser.email}`);
      console.log(`   Password: SuperAdmin123!`);
    } else {
      console.log('ℹ️  Super usuario ya existe:');
      console.log(`   Email: ${existingSuperUser.email}`);
    }

    console.log('\n⚠️ Generación de datos demo deshabilitada para producción.');

    console.log('\n🎉 SEED DEL SISTEMA COMPLETADO EXITOSAMENTE!');
    console.log('=====================================');
    
    console.log('\n🔑 CREDENCIALES DE ACCESO:');
    console.log('\n👑 SUPER ADMINISTRADOR:');
    console.log('   📧 Email: admin@menuview.app');
    console.log('   🔐 Password: SuperAdmin123!');
    console.log('   🌐 URL: http://localhost:5173/super-admin/login');

  } catch (error) {
    console.error('❌ Error durante el seed unificado:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function crearMenuCompleto(restaurante, menuData) {
  const categoriasCreadas = [];
  for (const cat of menuData.categorias) {
    const categoria = await prisma.categoria.upsert({
      where: {
        restauranteId_nombre: {
          restauranteId: restaurante.id,
          nombre: cat.nombre
        }
      },
      update: { descripcion: cat.descripcion, orden: cat.orden },
      create: {
        ...cat,
        restauranteId: restaurante.id,
        activa: true
      }
    });
    categoriasCreadas.push(categoria);
  }

  for (const prod of menuData.productos) {
    const categoria = categoriasCreadas.find(c => c.nombre === prod.categoria);
    if (categoria) {
    await prisma.producto.upsert({
      where: {
          restauranteId_nombre: {
            restauranteId: restaurante.id,
            nombre: prod.nombre
          }
        },
        update: {
          descripcion: prod.descripcion,
          precio: prod.precio,
          categoriaId: categoria.id
        },
      create: {
          nombre: prod.nombre,
          descripcion: prod.descripcion,
          precio: prod.precio,
          categoriaId: categoria.id,
          restauranteId: restaurante.id,
        disponible: true,
        orden: 1
      }
    });
    }
  }

  for (let i = 1; i <= menuData.mesas; i++) {
    await prisma.mesa.upsert({
      where: {
        restauranteId_numero: {
          restauranteId: restaurante.id,
          numero: i
        }
      },
      update: {},
      create: {
        numero: i,
        nombre: `Mesa ${i}`,
        capacidad: i <= 4 ? 2 : i <= 8 ? 4 : 6,
        qrCodeUrl: `QR-${restaurante.slug}-mesa-${i}`,
        restauranteId: restaurante.id,
        activo: true
      }
    });
  }
}

// Ejecutar seed si se llama directamente
if (require.main === module) {
  seedUnified()
    .then(() => {
      console.log('✅ Seed unificado completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el seed unificado:', error);
    process.exit(1);
  }); 
}

module.exports = { seedUnified }; 