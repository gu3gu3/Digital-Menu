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
      update: {
        precio: 0,
        limiteProductos: 25,
        limiteCategorias: 5,
        limiteMeseros: 1,
        limiteMesas: 5,
        limiteOrdenes: 300,
        soporteEmail: true,
        soporteChat: false,
        analiticas: false,
        activo: true
      },
      create: {
        nombre: 'Plan Gratuito',
        precio: 0,
        limiteProductos: 25,
        limiteCategorias: 5,
        limiteMeseros: 1,
        limiteMesas: 5,
        limiteOrdenes: 300,
        soporteEmail: true,
        soporteChat: false,
        analiticas: false,
        activo: true
      }
    });

    const planBasico = await prisma.plan.upsert({
      where: { nombre: 'Plan Básico' },
      update: {
        precio: 10,
        limiteProductos: 75,
        limiteCategorias: 15,
        limiteMeseros: 2,
        limiteMesas: 10,
        limiteOrdenes: 700,
        soporteEmail: true,
        soporteChat: false,
        analiticas: true,
        activo: true
      },
      create: {
        nombre: 'Plan Básico',
        precio: 10,
        limiteProductos: 75,
        limiteCategorias: 15,
        limiteMeseros: 2,
        limiteMesas: 10,
        limiteOrdenes: 700,
        soporteEmail: true,
        soporteChat: false,
        analiticas: true,
        activo: true
      }
    });

    const planPlatinum = await prisma.plan.upsert({
      where: { nombre: 'Plan Platinum' },
      update: {
        precio: 25,
        limiteProductos: 125,
        limiteCategorias: 25,
        limiteMeseros: 4,
        limiteMesas: 20,
        limiteOrdenes: 1000,
        soporteEmail: true,
        soporteChat: true,
        analiticas: true,
        activo: true
      },
      create: {
        nombre: 'Plan Platinum',
        precio: 25,
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
      where: { nombre: 'Plan Gold' },
      update: {
        precio: 50,
        limiteProductos: 200,
        limiteCategorias: 50,
        limiteMeseros: 8,
        limiteMesas: 40,
        limiteOrdenes: 3000,
        soporteEmail: true,
        soporteChat: true,
        analiticas: true,
        activo: true
      },
      create: {
        nombre: 'Plan Gold',
        precio: 50,
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
    console.log(`   - ${planPlatinum.nombre}: ${planPlatinum.limiteProductos} productos, ${planPlatinum.limiteOrdenes} órdenes, ${planPlatinum.limiteMesas} mesas, ${planPlatinum.limiteMeseros} meseros.`);
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
        planId: planPlatinum.id,
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

    // Restaurante 4: Demo Restaurant (para el demo público)
    const restauranteDemo = await prisma.restaurante.upsert({
      where: { slug: 'demo-restaurant' },
      update: {},
      create: {
        nombre: 'Demo Restaurant',
        slug: 'demo-restaurant',
        descripcion: 'Restaurante de demostración para mostrar las funcionalidades del sistema',
        telefono: '+1 555 123 4567',
        direccion: '123 Demo Street, Demo City',
        email: 'demo@restaurant.com',
        planId: planPlatinum.id,
        moneda: 'USD',
        backgroundColor: '#f3f4f6', // Gris claro para demo
        activo: true
      }
    });

    console.log('✅ Restaurantes demo creados:');
    console.log(`   - ${restaurante1.nombre} (${restaurante1.moneda}) - Plan: ${planBasico.nombre}`);
    console.log(`   - ${restaurante2.nombre} (${restaurante2.moneda}) - Plan: ${planPlatinum.nombre}`);
    console.log(`   - ${restaurante3.nombre} (${restaurante3.moneda}) - Plan: ${planGratuito.nombre}`);
    console.log(`   - ${restauranteDemo.nombre} (${restauranteDemo.moneda}) - Plan: ${planPlatinum.nombre} (DEMO)`);

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

    // Meseros para Don Ceviche (Plan Platinum - Límite 4)
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
    
    const restaurantes = [restaurante1, restaurante2, restaurante3, restauranteDemo];
    const planes = [planBasico, planPlatinum, planGratuito, planPlatinum];
    
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
      mesas: 20 // Límite del Plan Platinum
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

    // --- Menú para Demo Restaurant ---
    console.log('   -> Creando menú para Demo Restaurant...');
    await crearMenuCompleto(restauranteDemo, {
      categorias: [
        { nombre: 'Aperitivos', descripcion: 'Deliciosos aperitivos para empezar', orden: 1 },
        { nombre: 'Platos Principales', descripcion: 'Nuestras especialidades de la casa', orden: 2 },
        { nombre: 'Bebidas', descripcion: 'Refrescantes bebidas para acompañar', orden: 3 },
        { nombre: 'Postres', descripcion: 'Dulces tentaciones para finalizar', orden: 4 }
      ],
      productos: [
        { nombre: 'Nachos Supreme', descripcion: 'Nachos con queso, guacamole y jalapeños', precio: 12.99, categoria: 'Aperitivos' },
        { nombre: 'Alitas Buffalo', descripcion: 'Alitas picantes con salsa ranch', precio: 14.99, categoria: 'Aperitivos' },
        { nombre: 'Hamburguesa Clásica', descripcion: 'Carne angus, lechuga, tomate y queso cheddar', precio: 16.99, categoria: 'Platos Principales' },
        { nombre: 'Pizza Margherita', descripcion: 'Salsa de tomate, mozzarella fresca y albahaca', precio: 18.99, categoria: 'Platos Principales' },
        { nombre: 'Pasta Alfredo', descripcion: 'Fettuccine en cremosa salsa alfredo con pollo', precio: 19.99, categoria: 'Platos Principales' },
        { nombre: 'Salmón a la Parrilla', descripcion: 'Salmón fresco con verduras asadas', precio: 24.99, categoria: 'Platos Principales' },
        { nombre: 'Coca Cola', descripcion: 'Refresco clásico 355ml', precio: 2.99, categoria: 'Bebidas' },
        { nombre: 'Agua Mineral', descripcion: 'Agua mineral con gas 500ml', precio: 1.99, categoria: 'Bebidas' },
        { nombre: 'Café Americano', descripcion: 'Café recién preparado', precio: 3.99, categoria: 'Bebidas' },
        { nombre: 'Cerveza Corona', descripcion: 'Cerveza mexicana 355ml', precio: 4.99, categoria: 'Bebidas' },
        { nombre: 'Tiramisu', descripcion: 'Clásico postre italiano con café', precio: 7.99, categoria: 'Postres' },
        { nombre: 'Cheesecake', descripcion: 'Cremoso cheesecake de vainilla', precio: 6.99, categoria: 'Postres' },
        { nombre: 'Helado Artesanal', descripcion: 'Tres bolas de helado con toppings', precio: 5.99, categoria: 'Postres' }
      ],
      mesas: 20 // Plan Platinum
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