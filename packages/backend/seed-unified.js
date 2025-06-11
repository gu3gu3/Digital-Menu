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
    
    const planGratuito = await prisma.plan.upsert({
      where: { nombre: 'Plan Gratuito' },
      update: {},
      create: {
        nombre: 'Plan Gratuito',
        descripcion: 'Plan básico gratuito con funcionalidades esenciales',
        precio: 0,
        limiteProductos: 50,
        limiteOrdenes: 200,
        limiteMesas: 10,
        limiteMeseros: 2,
        activo: true
      }
    });

    const planBasico = await prisma.plan.upsert({
      where: { nombre: 'Plan Básico' },
      update: {},
      create: {
        nombre: 'Plan Básico',
        descripcion: 'Plan comercial con más funcionalidades y límites extendidos',
        precio: 29.99,
        limiteProductos: 100,
        limiteOrdenes: 500,
        limiteMesas: 20,
        limiteMeseros: 5,
        activo: true
      }
    });

    const planPremium = await prisma.plan.upsert({
      where: { nombre: 'Plan Premium' },
      update: {},
      create: {
        nombre: 'Plan Premium',
        descripcion: 'Plan premium con todas las funcionalidades y límites amplios',
        precio: 59.99,
        limiteProductos: 500,
        limiteOrdenes: 2000,
        limiteMesas: 50,
        limiteMeseros: 15,
        activo: true
      }
    });

    console.log('✅ Planes creados exitosamente:');
    console.log(`   - ${planGratuito.nombre}: $${planGratuito.precio} (Límite: ${planGratuito.limiteProductos} productos)`);
    console.log(`   - ${planBasico.nombre}: $${planBasico.precio} (Límite: ${planBasico.limiteProductos} productos)`);
    console.log(`   - ${planPremium.nombre}: $${planPremium.precio} (Límite: ${planPremium.limiteProductos} productos)`);

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

    // ========================================
    // 3. CREAR RESTAURANTES DEMO
    // ========================================
    console.log('\n🏪 Creando restaurantes demo...');
    
    // Crear passwords hasheados para los admins
    const hashedPassword = await bcrypt.hash('demo123456', 12);

    // Restaurante 1: La Parrilla Criolla
    const restaurante1 = await prisma.restaurante.upsert({
      where: { slug: 'la-parrilla-criolla' },
      update: {},
      create: {
        nombre: 'La Parrilla Criolla',
        slug: 'la-parrilla-criolla',
        descripcion: 'Auténtica comida criolla con el mejor sabor casero',
        telefono: '+51 987 654 321',
        direccion: 'Av. Arequipa 1234, Miraflores, Lima',
        email: 'info@laparrillacriolla.com',
        planId: planBasico.id,
        moneda: 'USD',
        backgroundColor: '#fef3c7', // Amarillo claro para comida criolla
        activo: true
      }
    });

    // Restaurante 2: Don Ceviche
    const restaurante2 = await prisma.restaurante.upsert({
      where: { slug: 'don-ceviche' },
      update: {},
      create: {
        nombre: 'Don Ceviche',
        slug: 'don-ceviche',
        descripcion: 'Los mejores ceviches y mariscos frescos de la ciudad',
        telefono: '+51 955 444 333',
        direccion: 'Malecón de la Reserva 456, Miraflores, Lima',
        email: 'admin@donceviche.com',
        planId: planPremium.id,
        moneda: 'NIO',
        backgroundColor: '#f0f9ff', // Azul claro para mariscos
        activo: true
      }
    });

    // Restaurante 3: Bella Vista
    const restaurante3 = await prisma.restaurante.upsert({
      where: { slug: 'bella-vista' },
      update: {},
      create: {
        nombre: 'Bella Vista',
        slug: 'bella-vista',
        descripcion: 'Cocina internacional con vista panorámica',
        telefono: '+51 922 111 999',
        direccion: 'Jr. de la Unión 789, Centro de Lima',
        email: 'admin@bellavista.com',
        planId: planGratuito.id,
        moneda: 'CRC',
        backgroundColor: '#ecfdf5', // Verde claro para cocina internacional
        activo: true
      }
    });

    console.log('✅ Restaurantes demo creados:');
    console.log(`   - ${restaurante1.nombre} (${restaurante1.moneda}) - Plan: ${planBasico.nombre}`);
    console.log(`   - ${restaurante2.nombre} (${restaurante2.moneda}) - Plan: ${planPremium.nombre}`);
    console.log(`   - ${restaurante3.nombre} (${restaurante3.moneda}) - Plan: ${planGratuito.nombre}`);

    // ========================================
    // 4. CREAR USUARIOS ADMIN DE RESTAURANTES
    // ========================================
    console.log('\n👨‍💼 Creando usuarios administradores...');
    
    const admin1 = await prisma.usuarioAdmin.upsert({
      where: { email: 'admin@laparrillacriolla.com' },
      update: {},
      create: {
        email: 'admin@laparrillacriolla.com',
        password: hashedPassword,
        nombre: 'María',
        apellido: 'González',
        telefono: '+51 999 888 777',
        restauranteId: restaurante1.id,
        activo: true,
        emailVerificado: true
      }
    });

    const admin2 = await prisma.usuarioAdmin.upsert({
      where: { email: 'admin@donceviche.com' },
      update: {},
      create: {
        email: 'admin@donceviche.com',
        password: hashedPassword,
        nombre: 'Carlos',
        apellido: 'Mendoza',
        telefono: '+51 988 777 666',
        restauranteId: restaurante2.id,
        activo: true,
        emailVerificado: true
      }
    });

    const admin3 = await prisma.usuarioAdmin.upsert({
      where: { email: 'admin@bellavista.com' },
      update: {},
      create: {
        email: 'admin@bellavista.com',
        password: hashedPassword,
        nombre: 'Ana',
        apellido: 'Torres',
        telefono: '+51 977 666 555',
        restauranteId: restaurante3.id,
        activo: true,
        emailVerificado: true
      }
    });

    console.log('✅ Usuarios admin creados para cada restaurante');

    // ========================================
    // 5. CREAR SUSCRIPCIONES
    // ========================================
    console.log('\n💳 Creando suscripciones...');
    
    const restaurantes = [restaurante1, restaurante2, restaurante3];
    const planes = [planBasico, planPremium, planGratuito];
    
    for (let i = 0; i < restaurantes.length; i++) {
      const restaurante = restaurantes[i];
      const plan = planes[i];
      
      // Verificar si ya tiene suscripción
      const existingSuscripcion = await prisma.suscripcion.findUnique({
        where: { restauranteId: restaurante.id }
      });
      
      if (!existingSuscripcion) {
        const fechaVencimiento = new Date();
        if (plan.nombre === 'Plan Gratuito') {
          fechaVencimiento.setDate(fechaVencimiento.getDate() + 30); // 30 días
        } else {
          fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1); // 1 mes
        }

        await prisma.suscripcion.create({
          data: {
            restauranteId: restaurante.id,
            planId: plan.id,
            estado: 'ACTIVA',
            fechaInicio: new Date(),
            fechaVencimiento,
            mesesPagados: 1,
            montoUltimoPago: plan.precio,
            notasAdmin: 'Suscripción demo creada automáticamente'
          }
        });

        // Crear notificación de bienvenida
        await prisma.notificacionUsuario.create({
          data: {
            restauranteId: restaurante.id,
            tipo: 'BIENVENIDA',
            titulo: '¡Bienvenido al Sistema Digital Menu!',
            mensaje: `Su suscripción al ${plan.nombre} está activa hasta ${fechaVencimiento.toLocaleDateString()}. Puede gestionar su menú digital desde el panel de administración.`
          }
        });
        
        console.log(`   ✅ Suscripción creada para ${restaurante.nombre}`);
      }
    }

    // ========================================
    // 6. CREAR DATOS DE MENÚ PARA DEMO
    // ========================================
    console.log('\n📂 Creando categorías y productos demo...');
    
    // Solo crear menú para el primer restaurante
    const restauranteDemo = restaurante1;
    
    const categorias = [
      { nombre: 'Entradas', descripcion: 'Deliciosas entradas para comenzar', orden: 1 },
      { nombre: 'Platos Principales', descripcion: 'Nuestros platos estrella', orden: 2 },
      { nombre: 'Carnes y Parrillas', descripcion: 'Las mejores carnes a la parrilla', orden: 3 },
      { nombre: 'Bebidas', descripcion: 'Refrescantes bebidas naturales', orden: 4 },
      { nombre: 'Postres', descripcion: 'Dulces tentaciones para finalizar', orden: 5 }
    ];

    const categoriasCreadas = [];
    for (const cat of categorias) {
      const categoria = await prisma.categoria.upsert({
        where: { 
          restauranteId_nombre: {
            restauranteId: restauranteDemo.id,
            nombre: cat.nombre
          }
        },
        update: {},
        create: {
          ...cat,
          restauranteId: restauranteDemo.id,
          activa: true
        }
      });
      categoriasCreadas.push(categoria);
    }

    // Crear productos demo
    const productos = [
      { nombre: 'Tequeños de Queso', descripcion: 'Deliciosos tequeños crujientes', precio: 18.00, categoria: 'Entradas' },
      { nombre: 'Causa Limeña', descripcion: 'Papa amarilla con pollo y palta', precio: 22.00, categoria: 'Entradas' },
      { nombre: 'Arroz Chaufa', descripcion: 'Arroz frito al estilo chino', precio: 28.00, categoria: 'Platos Principales' },
      { nombre: 'Tallarín Saltado', descripcion: 'Fideos saltados con carne', precio: 32.00, categoria: 'Platos Principales' },
      { nombre: 'Bife de Chorizo', descripcion: 'Jugoso bife a la parrilla', precio: 58.00, categoria: 'Carnes y Parrillas' },
      { nombre: 'Pollo a la Brasa', descripcion: 'Pollo dorado con papas', precio: 42.00, categoria: 'Carnes y Parrillas' },
      { nombre: 'Chicha Morada', descripcion: 'Bebida tradicional peruana', precio: 8.00, categoria: 'Bebidas' },
      { nombre: 'Limonada', descripcion: 'Refrescante limonada natural', precio: 6.00, categoria: 'Bebidas' },
      { nombre: 'Tres Leches', descripcion: 'Clásico postre de tres leches', precio: 15.00, categoria: 'Postres' },
      { nombre: 'Suspiro Limeño', descripcion: 'Delicioso postre tradicional', precio: 12.00, categoria: 'Postres' }
    ];

    for (const prod of productos) {
      const categoria = categoriasCreadas.find(c => c.nombre === prod.categoria);
      if (categoria) {
        await prisma.producto.upsert({
          where: {
            restauranteId_categoriaId_nombre: {
              restauranteId: restauranteDemo.id,
              categoriaId: categoria.id,
              nombre: prod.nombre
            }
          },
          update: {},
          create: {
            nombre: prod.nombre,
            descripcion: prod.descripcion,
            precio: prod.precio,
            categoriaId: categoria.id,
            restauranteId: restauranteDemo.id,
            disponible: true,
            orden: 1
          }
        });
      }
    }

    // Crear mesas demo
    console.log('\n🪑 Creando mesas demo...');
    for (let i = 1; i <= 12; i++) {
      await prisma.mesa.upsert({
        where: {
          restauranteId_numero: {
            restauranteId: restauranteDemo.id,
            numero: i.toString()
          }
        },
        update: {},
        create: {
          numero: i.toString(),
          nombre: `Mesa ${i}`,
          descripcion: `Mesa para ${i <= 4 ? '2' : i <= 8 ? '4' : '6'} personas`,
          capacidad: i <= 4 ? 2 : i <= 8 ? 4 : 6,
          qrCode: `QR-${restauranteDemo.slug}-mesa-${i}`,
          restauranteId: restauranteDemo.id,
          activa: true
        }
      });
    }

    console.log('✅ Menú demo creado para La Parrilla Criolla');

    // ========================================
    // 7. ESTADÍSTICAS FINALES
    // ========================================
    console.log('\n📊 Estadísticas del sistema:');
    console.log('=====================================');
    
    const totalPlanes = await prisma.plan.count();
    const totalRestaurantes = await prisma.restaurante.count();
    const totalSuscripciones = await prisma.suscripcion.count();
    const totalAdmins = await prisma.usuarioAdmin.count();
    const totalSuperUsers = await prisma.superUsuario.count();
    const totalProductos = await prisma.producto.count();
    const totalMesas = await prisma.mesa.count();

    console.log(`📋 Planes: ${totalPlanes}`);
    console.log(`🏪 Restaurantes: ${totalRestaurantes}`);
    console.log(`💳 Suscripciones: ${totalSuscripciones}`);
    console.log(`👨‍💼 Admins: ${totalAdmins}`);
    console.log(`👑 Super Admins: ${totalSuperUsers}`);
    console.log(`🍽️ Productos: ${totalProductos}`);
    console.log(`🪑 Mesas: ${totalMesas}`);

    console.log('\n🎉 SEED UNIFICADO COMPLETADO EXITOSAMENTE!');
    console.log('=====================================');
    
    console.log('\n🔑 CREDENCIALES DE ACCESO:');
    console.log('\n👑 SUPER ADMINISTRADOR:');
    console.log('   📧 Email: admin@menuview.app');
    console.log('   🔐 Password: SuperAdmin123!');
    console.log('   🌐 URL: http://localhost:5173/super-admin/login');
    
    console.log('\n👨‍💼 ADMINISTRADORES DE RESTAURANTE:');
    console.log('   1. La Parrilla Criolla (USD):');
    console.log('      📧 Email: admin@laparrillacriolla.com');
    console.log('      🔐 Password: demo123456');
    console.log('      🌐 Menu: http://localhost:5173/menu/la-parrilla-criolla');
    
    console.log('   2. Don Ceviche (NIO):');
    console.log('      📧 Email: admin@donceviche.com');
    console.log('      🔐 Password: demo123456');
    console.log('      🌐 Menu: http://localhost:5173/menu/don-ceviche');
    
    console.log('   3. Bella Vista (CRC):');
    console.log('      📧 Email: admin@bellavista.com');
    console.log('      🔐 Password: demo123456');
    console.log('      🌐 Menu: http://localhost:5173/menu/bella-vista');

    console.log('\n🔗 URLS PRINCIPALES:');
    console.log('   🏠 Landing: http://localhost:5173/');
    console.log('   👨‍💼 Admin Login: http://localhost:5173/admin/login');
    console.log('   👑 Super Admin: http://localhost:5173/super-admin/dashboard');

  } catch (error) {
    console.error('❌ Error durante el seed unificado:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
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