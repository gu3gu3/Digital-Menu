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
      where: { nombre: 'Gratuito' },
      update: {
        precio: 0,
        limiteProductos: 25,
        limiteCategorias: 5, // Asumiendo un valor razonable
        limiteMeseros: 1,
        limiteMesas: 5,
        limiteOrdenes: 300,
        soporteEmail: false,
        soporteChat: false,
        analiticas: false,
        activo: true
      },
      create: {
        nombre: 'Gratuito',
        precio: 0,
        limiteProductos: 25,
        limiteCategorias: 5,
        limiteMeseros: 1,
        limiteMesas: 5,
        limiteOrdenes: 300,
        soporteEmail: false,
        soporteChat: false,
        analiticas: false,
        activo: true
      }
    });

    const planBasico = await prisma.plan.upsert({
      where: { nombre: 'Básico' },
      update: {
        precio: 29.99, // Manteniendo un precio de ejemplo
        limiteProductos: 75,
        limiteCategorias: 15, // Asumiendo un valor razonable
        limiteMeseros: 2,
        limiteMesas: 10,
        limiteOrdenes: 750,
        soporteEmail: true,
        soporteChat: false,
        analiticas: true,
        activo: true
      },
      create: {
        nombre: 'Básico',
        precio: 29.99,
        limiteProductos: 75,
        limiteCategorias: 15,
        limiteMeseros: 2,
        limiteMesas: 10,
        limiteOrdenes: 750,
        soporteEmail: true,
        soporteChat: false,
        analiticas: true,
        activo: true
      }
    });

    const planPlatinium = await prisma.plan.upsert({
      where: { nombre: 'Platinium' },
      update: {
        precio: 59.99, // Manteniendo un precio de ejemplo
        limiteProductos: 125,
        limiteCategorias: 25, // Asumiendo un valor razonable
        limiteMeseros: 4,
        limiteMesas: 20,
        limiteOrdenes: 1000,
        soporteEmail: true,
        soporteChat: true,
        analiticas: true,
        activo: true
      },
      create: {
        nombre: 'Platinium',
        precio: 59.99,
        limiteProductos: 125,
        limiteCategorias: 25,
        limiteMeseros: 4,
        limiteMesas: 20,
        limiteOrdenes: 1000,
        soporteEmail: true,
        soporteChat: true,
        analiticas: true,
        activo: true
      }
    });

    const planGold = await prisma.plan.upsert({
      where: { nombre: 'Gold' },
      update: {
        precio: 99.99, // Manteniendo un precio de ejemplo
        limiteProductos: 200,
        limiteCategorias: 50, // Asumiendo un valor razonable
        limiteMeseros: 8,
        limiteMesas: 40,
        limiteOrdenes: 3000,
        soporteEmail: true,
        soporteChat: true,
        analiticas: true,
        activo: true
      },
      create: {
        nombre: 'Gold',
        precio: 99.99,
        limiteProductos: 200,
        limiteCategorias: 50,
        limiteMeseros: 8,
        limiteMesas: 40,
        limiteOrdenes: 3000,
        soporteEmail: true,
        soporteChat: true,
        analiticas: true,
        activo: true
      }
    });

    console.log('✅ Planes creados exitosamente:');
    console.log(`   - ${planGratuito.nombre}: ${planGratuito.limiteProductos} productos, ${planGratuito.limiteOrdenes} órdenes, ${planGratuito.limiteMesas} mesas, ${planGratuito.limiteMeseros} meseros.`);
    console.log(`   - ${planBasico.nombre}: ${planBasico.limiteProductos} productos, ${planBasico.limiteOrdenes} órdenes, ${planBasico.limiteMesas} mesas, ${planBasico.limiteMeseros} meseros.`);
    console.log(`   - ${planPlatinium.nombre}: ${planPlatinium.limiteProductos} productos, ${planPlatinium.limiteOrdenes} órdenes, ${planPlatinium.limiteMesas} mesas, ${planPlatinium.limiteMeseros} meseros.`);
    console.log(`   - ${planGold.nombre}: ${planGold.limiteProductos} productos, ${planGold.limiteOrdenes} órdenes, ${planGold.limiteMesas} mesas, ${planGold.limiteMeseros} meseros.`);

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
        planId: planPlatinium.id,
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
    console.log(`   - ${restaurante2.nombre} (${restaurante2.moneda}) - Plan: ${planPlatinium.nombre}`);
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
    // 5. CREAR MESEROS DEMO
    // ========================================
    console.log('\n👨‍🍳 Creando meseros demo (llevando al límite del plan)...');
    const hashedMeseroPassword = await bcrypt.hash('mesero123', 12);

    // Meseros para La Parrilla Criolla (Plan Básico - Límite 2)
    await prisma.usuarioMesero.upsert({
        where: { email: 'juan.perez@parrilla.com' },
      update: {},
      create: {
            email: 'juan.perez@parrilla.com',
            password: hashedMeseroPassword,
            nombre: 'Juan',
            apellido: 'Perez',
            restauranteId: restaurante1.id,
            activo: true,
        }
    });
    await prisma.usuarioMesero.upsert({
        where: { email: 'lucia.gomez@parrilla.com' },
      update: {},
      create: {
            email: 'lucia.gomez@parrilla.com',
            password: hashedMeseroPassword,
            nombre: 'Lucía',
            apellido: 'Gómez',
            restauranteId: restaurante1.id,
            activo: true,
        }
    });
    console.log(`   - 2/2 meseros creados para La Parrilla Criolla`);

    // Meseros para Don Ceviche (Plan Platinium - Límite 4)
    for (let i = 1; i <= 4; i++) {
        await prisma.usuarioMesero.upsert({
            where: { email: `mesero${i}@ceviche.com` },
      update: {},
      create: {
                email: `mesero${i}@ceviche.com`,
                password: hashedMeseroPassword,
                nombre: `Mesero ${i}`,
                apellido: 'Ceviche',
                restauranteId: restaurante2.id,
                activo: true,
            }
        });
    }
    console.log(`   - 4/4 meseros creados para Don Ceviche`);

    // Mesero para Bella Vista (Plan Gratuito - Límite 1)
    await prisma.usuarioMesero.upsert({
        where: { email: 'elena@bellavista.com' },
      update: {},
      create: {
            email: 'elena@bellavista.com',
            password: hashedMeseroPassword,
            nombre: 'Elena',
            apellido: 'Vargas',
            restauranteId: restaurante3.id,
            activo: true,
        }
    });
    console.log(`   - 1/1 mesero creado para Bella Vista`);
    
    // ========================================
    // 6. CREAR SUSCRIPCIONES
    // ========================================
    console.log('\n💳 Creando suscripciones...');
    
    const restaurantes = [restaurante1, restaurante2, restaurante3];
    const planes = [planBasico, planPlatinium, planGratuito];
    
    for (let i = 0; i < restaurantes.length; i++) {
      const restaurante = restaurantes[i];
      const plan = planes[i];
      
      // Verificar si ya tiene suscripción
      const existingSuscripcion = await prisma.suscripcion.findUnique({
        where: { restauranteId: restaurante.id }
      });
      
      if (!existingSuscripcion) {
        const fechaVencimiento = new Date();
        if (plan.nombre === 'Gratuito') {
          fechaVencimiento.setDate(fechaVencimiento.getDate() + 30); // 30 días
        } else {
          fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1); // 1 mes
        }

        await prisma.suscripcion.create({
          data: {
            restauranteId: restaurante.id,
            estado: 'ACTIVA',
            fechaInicio: new Date(),
            fechaVencimiento,
            historialPagos: {
      create: {
                monto: plan.precio,
                mesesPagados: 1,
                metodoPago: 'DEMO',
                procesadoPor: 'system-seed',
                notas: 'Pago demo creado automáticamente'
              }
            }
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
    // 7. CREAR DATOS DE MENÚ PARA DEMO
    // ========================================
    console.log('\n📂 Creando categorías y productos demo...');
    
    // --- Menú para La Parrilla Criolla ---
    console.log('   -> Creando menú para La Parrilla Criolla...');
    await crearMenuCompleto(restaurante1, {
      categorias: [
        { nombre: 'Entradas Criollas', descripcion: 'Deliciosas entradas para comenzar', orden: 1 },
        { nombre: 'Platos de Fondo', descripcion: 'Nuestros platos estrella', orden: 2 },
        { nombre: 'Parrillas', descripcion: 'Las mejores carnes a la parrilla', orden: 3 },
        { nombre: 'Bebidas de la Casa', descripcion: 'Refrescantes bebidas naturales', orden: 4 },
        { nombre: 'Postres Caseros', descripcion: 'Dulces tentaciones para finalizar', orden: 5 }
      ],
      productos: [
        { nombre: 'Tequeños de Queso', descripcion: 'Deliciosos tequeños crujientes', precio: 18.00, categoria: 'Entradas Criollas' },
        { nombre: 'Causa Limeña de Pollo', descripcion: 'Papa amarilla con pollo y palta', precio: 22.00, categoria: 'Entradas Criollas' },
        { nombre: 'Lomo Saltado', descripcion: 'Trozos de lomo fino salteados con cebolla y tomate', precio: 45.00, categoria: 'Platos de Fondo' },
        { nombre: 'Aji de Gallina', descripcion: 'Clásico plato de gallina deshilachada en crema de ají amarillo', precio: 35.00, categoria: 'Platos de Fondo' },
        { nombre: 'Bife de Chorizo', descripcion: 'Jugoso bife a la parrilla de 300g', precio: 58.00, categoria: 'Parrillas' },
        { nombre: 'Pollo a la Brasa', descripcion: 'Pollo dorado con papas y ensalada', precio: 42.00, categoria: 'Parrillas' },
        { nombre: 'Chicha Morada', descripcion: 'Bebida tradicional de maíz morado (Jarra 1L)', precio: 15.00, categoria: 'Bebidas de la Casa' },
        { nombre: 'Maracuyá Frozen', descripcion: 'Refrescante jugo frozen de maracuyá', precio: 12.00, categoria: 'Bebidas de la Casa' },
        { nombre: 'Picarones', descripcion: 'Clásicos aros fritos bañados en miel de chancaca', precio: 15.00, categoria: 'Postres Caseros' },
        { nombre: 'Torta de Chocolate', descripcion: 'Húmeda torta de chocolate con fudge casero', precio: 18.00, categoria: 'Postres Caseros' }
      ],
      mesas: 10 // Límite del Plan Básico
    });

    // --- Menú para Don Ceviche ---
    console.log('   -> Creando menú para Don Ceviche...');
    await crearMenuCompleto(restaurante2, {
      categorias: [
        { nombre: 'Ceviches Clásicos', descripcion: 'La frescura del mar en un plato', orden: 1 },
        { nombre: 'Tiraditos', descripcion: 'Finas láminas de pescado en salsas únicas', orden: 2 },
        { nombre: 'Arroces y Risottos', descripcion: 'Contundentes platos marinos', orden: 3 },
        { nombre: 'Bebidas', descripcion: 'Para acompañar el sabor marino', orden: 4 }
      ],
      productos: [
        { nombre: 'Ceviche Clásico', descripcion: 'Pesca del día en leche de tigre', precio: 38.00, categoria: 'Ceviches Clásicos' },
        { nombre: 'Ceviche Mixto', descripcion: 'Pescado, mariscos, y leche de tigre', precio: 45.00, categoria: 'Ceviches Clásicos' },
        { nombre: 'Tiradito en Crema de Ají Amarillo', descripcion: 'Láminas de pescado fresco en salsa de ají', precio: 35.00, categoria: 'Tiraditos' },
        { nombre: 'Arroz con Mariscos', descripcion: 'Un clásico del norte con abundante marisco', precio: 48.00, categoria: 'Arroces y Risottos' },
        { nombre: 'Cerveza Pilsen', descripcion: 'Botella de 620ml', precio: 12.00, categoria: 'Bebidas' },
        { nombre: 'Copa de Vino Blanco', descripcion: 'Sauvignon Blanc, Tabernero', precio: 15.00, categoria: 'Bebidas' }
      ],
      mesas: 20 // Límite del Plan Platinium
    });

    // --- Menú para Bella Vista ---
    console.log('   -> Creando menú para Bella Vista...');
    await crearMenuCompleto(restaurante3, {
      categorias: [
        { nombre: 'Tapas y Entrantes', descripcion: 'Pequeños bocados para compartir', orden: 1 },
        { nombre: 'Platos Fuertes', descripcion: 'Sabores del mundo', orden: 2 },
        { nombre: 'Café y Postres', descripcion: 'El final perfecto', orden: 3 },
      ],
      productos: [
        { nombre: 'Bruschettas de Prosciutto', descripcion: 'Pan tostado con tomate, albahaca y prosciutto', precio: 25.00, categoria: 'Tapas y Entrantes' },
        { nombre: 'Ravioles de Espinaca', descripcion: 'Pasta fresca en salsa de 4 quesos', precio: 38.00, categoria: 'Platos Fuertes' },
        { nombre: 'Café Americano', descripcion: 'Café de grano recién pasado', precio: 8.00, categoria: 'Café y Postres' },
        { nombre: 'Cheesecake de Fresa', descripcion: 'Cremoso cheesecake con coulis de fresa', precio: 18.00, categoria: 'Café y Postres' }
      ],
      mesas: 5 // Límite del Plan Gratuito
    });

    // ========================================
    // 8. ESTADÍSTICAS FINALES
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
    const totalMeseros = await prisma.usuarioMesero.count();

    console.log(`📋 Planes: ${totalPlanes}`);
    console.log(`🏪 Restaurantes: ${totalRestaurantes}`);
    console.log(`💳 Suscripciones: ${totalSuscripciones}`);
    console.log(`👨‍💼 Admins: ${totalAdmins}`);
    console.log(`👑 Super Admins: ${totalSuperUsers}`);
    console.log(`🍽️ Productos: ${totalProductos}`);
    console.log(`🪑 Mesas: ${totalMesas}`);
    console.log(`👨‍🍳 Meseros: ${totalMeseros}`);

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