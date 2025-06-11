const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  try {
    // Crear planes por defecto
    console.log('📋 Creando planes...');
    
    const planGratuito = await prisma.plan.upsert({
      where: { nombre: 'Gratuito' },
      update: {},
      create: {
        nombre: 'Gratuito',
        descripcion: 'Plan gratuito con funcionalidades básicas',
        precio: 0,
        limiteProductos: 50,
        limiteOrdenes: 200,
        limiteMesas: 10,
        limiteMeseros: 2,
        activo: true
      }
    });

    const planBasico = await prisma.plan.upsert({
      where: { nombre: 'Básico' },
      update: {},
      create: {
        nombre: 'Básico',
        descripcion: 'Plan básico con más funcionalidades',
        precio: 29.99,
        limiteProductos: 200,
        limiteOrdenes: 1000,
        limiteMesas: 50,
        limiteMeseros: 10,
        activo: true
      }
    });

    const planPremium = await prisma.plan.upsert({
      where: { nombre: 'Premium' },
      update: {},
      create: {
        nombre: 'Premium',
        descripcion: 'Plan premium con funcionalidades ilimitadas',
        precio: 79.99,
        limiteProductos: -1, // -1 significa ilimitado
        limiteOrdenes: -1,
        limiteMesas: -1,
        limiteMeseros: -1,
        activo: true
      }
    });

    console.log('✅ Planes creados correctamente');

    // Crear restaurante de demostración
    console.log('🏪 Creando restaurante de demostración...');
    
    const restauranteDemo = await prisma.restaurante.upsert({
      where: { email: 'demo@restaurant.com' },
      update: {},
      create: {
        nombre: 'Restaurante Demo',
        descripcion: 'Restaurante de demostración para el sistema de menú digital',
        telefono: '+1-234-567-8900',
        direccion: '123 Calle Principal, Ciudad Demo, País',
        email: 'demo@restaurant.com',
        planId: planGratuito.id,
        activo: true
      }
    });

    // Crear superusuario administrador
    console.log('👤 Creando superusuario...');
    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      process.env.SUPER_USER_PASSWORD || 'admin123',
      saltRounds
    );

    const superAdmin = await prisma.usuarioAdmin.upsert({
      where: { email: process.env.SUPER_USER_EMAIL || 'admin@digitalmenu.com' },
      update: {},
      create: {
        email: process.env.SUPER_USER_EMAIL || 'admin@digitalmenu.com',
        password: hashedPassword,
        nombre: process.env.SUPER_USER_NAME || 'Super Admin',
        apellido: 'Sistema',
        telefono: '+1-234-567-8901',
        restauranteId: restauranteDemo.id,
        activo: true,
        emailVerificado: true
      }
    });

    // Crear usuario mesero de ejemplo
    console.log('👨‍💼 Creando mesero de ejemplo...');
    
    const hashedPasswordMesero = await bcrypt.hash('mesero123', saltRounds);
    
    const meseroDemo = await prisma.usuarioMesero.upsert({
      where: { email: 'mesero@demo.com' },
      update: {},
      create: {
        email: 'mesero@demo.com',
        password: hashedPasswordMesero,
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+1-234-567-8902',
        restauranteId: restauranteDemo.id,
        activo: true
      }
    });

    // Crear categorías de ejemplo
    console.log('📂 Creando categorías de ejemplo...');
    
    const categoriaEntradas = await prisma.categoria.upsert({
      where: { 
        restauranteId_nombre: {
          restauranteId: restauranteDemo.id,
          nombre: 'Entradas'
        }
      },
      update: {},
      create: {
        nombre: 'Entradas',
        descripcion: 'Aperitivos y entradas para comenzar',
        orden: 1,
        restauranteId: restauranteDemo.id,
        activa: true
      }
    });

    const categoriaPlatos = await prisma.categoria.upsert({
      where: { 
        restauranteId_nombre: {
          restauranteId: restauranteDemo.id,
          nombre: 'Platos Principales'
        }
      },
      update: {},
      create: {
        nombre: 'Platos Principales',
        descripcion: 'Platos fuertes y principales',
        orden: 2,
        restauranteId: restauranteDemo.id,
        activa: true
      }
    });

    const categoriaBebidas = await prisma.categoria.upsert({
      where: { 
        restauranteId_nombre: {
          restauranteId: restauranteDemo.id,
          nombre: 'Bebidas'
        }
      },
      update: {},
      create: {
        nombre: 'Bebidas',
        descripcion: 'Bebidas frías y calientes',
        orden: 3,
        restauranteId: restauranteDemo.id,
        activa: true
      }
    });

    const categoriaPostres = await prisma.categoria.upsert({
      where: { 
        restauranteId_nombre: {
          restauranteId: restauranteDemo.id,
          nombre: 'Postres'
        }
      },
      update: {},
      create: {
        nombre: 'Postres',
        descripcion: 'Dulces y postres para finalizar',
        orden: 4,
        restauranteId: restauranteDemo.id,
        activa: true
      }
    });

    // Crear productos de ejemplo
    console.log('🍽️ Creando productos de ejemplo...');
    
    // Entradas
    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaEntradas.id,
          nombre: 'Nachos Supremos'
        }
      },
      update: {},
      create: {
        nombre: 'Nachos Supremos',
        descripcion: 'Nachos con queso, jalapeños, guacamole y crema agria',
        precio: 12.99,
        categoriaId: categoriaEntradas.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 1
      }
    });

    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaEntradas.id,
          nombre: 'Alitas BBQ'
        }
      },
      update: {},
      create: {
        nombre: 'Alitas BBQ',
        descripcion: 'Alitas de pollo bañadas en salsa BBQ casera',
        precio: 15.99,
        categoriaId: categoriaEntradas.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 2
      }
    });

    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaEntradas.id,
          nombre: 'Quesadillas de Pollo'
        }
      },
      update: {},
      create: {
        nombre: 'Quesadillas de Pollo',
        descripcion: 'Tortillas de harina con pollo, queso y pimientos',
        precio: 11.99,
        categoriaId: categoriaEntradas.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 3
      }
    });

    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaEntradas.id,
          nombre: 'Calamares Fritos'
        }
      },
      update: {},
      create: {
        nombre: 'Calamares Fritos',
        descripcion: 'Anillos de calamar empanizados con salsa marinara',
        precio: 14.99,
        categoriaId: categoriaEntradas.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 4
      }
    });

    // Platos principales
    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaPlatos.id,
          nombre: 'Hamburguesa Clásica'
        }
      },
      update: {},
      create: {
        nombre: 'Hamburguesa Clásica',
        descripcion: 'Hamburguesa de carne con queso, lechuga, tomate y papas fritas',
        precio: 18.99,
        categoriaId: categoriaPlatos.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 1
      }
    });

    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaPlatos.id,
          nombre: 'Salmón a la Parrilla'
        }
      },
      update: {},
      create: {
        nombre: 'Salmón a la Parrilla',
        descripcion: 'Filete de salmón con vegetales asados y arroz',
        precio: 24.99,
        categoriaId: categoriaPlatos.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 2
      }
    });

    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaPlatos.id,
          nombre: 'Pasta Alfredo'
        }
      },
      update: {},
      create: {
        nombre: 'Pasta Alfredo',
        descripcion: 'Fettuccine en salsa cremosa de queso parmesano',
        precio: 16.99,
        categoriaId: categoriaPlatos.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 3
      }
    });

    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaPlatos.id,
          nombre: 'Tacos de Carnitas'
        }
      },
      update: {},
      create: {
        nombre: 'Tacos de Carnitas',
        descripcion: 'Tres tacos de carnitas con cebolla, cilantro y salsa verde',
        precio: 13.99,
        categoriaId: categoriaPlatos.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 4
      }
    });

    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaPlatos.id,
          nombre: 'Pizza Margherita'
        }
      },
      update: {},
      create: {
        nombre: 'Pizza Margherita',
        descripcion: 'Pizza artesanal con tomate, mozzarella fresca y albahaca',
        precio: 19.99,
        categoriaId: categoriaPlatos.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 5
      }
    });

    // Bebidas
    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaBebidas.id,
          nombre: 'Coca Cola'
        }
      },
      update: {},
      create: {
        nombre: 'Coca Cola',
        descripcion: 'Refresco de cola 355ml',
        precio: 2.99,
        categoriaId: categoriaBebidas.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 1
      }
    });

    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaBebidas.id,
          nombre: 'Jugo de Naranja Natural'
        }
      },
      update: {},
      create: {
        nombre: 'Jugo de Naranja Natural',
        descripcion: 'Jugo de naranja recién exprimido 250ml',
        precio: 4.99,
        categoriaId: categoriaBebidas.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 2
      }
    });

    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaBebidas.id,
          nombre: 'Agua Mineral'
        }
      },
      update: {},
      create: {
        nombre: 'Agua Mineral',
        descripcion: 'Agua mineral natural 500ml',
        precio: 1.99,
        categoriaId: categoriaBebidas.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 3
      }
    });

    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaBebidas.id,
          nombre: 'Café Americano'
        }
      },
      update: {},
      create: {
        nombre: 'Café Americano',
        descripcion: 'Café negro recién preparado',
        precio: 3.50,
        categoriaId: categoriaBebidas.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 4
      }
    });

    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaBebidas.id,
          nombre: 'Limonada Natural'
        }
      },
      update: {},
      create: {
        nombre: 'Limonada Natural',
        descripcion: 'Limonada fresca con menta y hielo',
        precio: 4.50,
        categoriaId: categoriaBebidas.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 5
      }
    });

    // Postres
    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaPostres.id,
          nombre: 'Cheesecake de Fresa'
        }
      },
      update: {},
      create: {
        nombre: 'Cheesecake de Fresa',
        descripcion: 'Pastel de queso con coulis de fresa',
        precio: 8.99,
        categoriaId: categoriaPostres.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 1
      }
    });

    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaPostres.id,
          nombre: 'Tiramisú'
        }
      },
      update: {},
      create: {
        nombre: 'Tiramisú',
        descripcion: 'Postre italiano con café, mascarpone y cacao',
        precio: 9.99,
        categoriaId: categoriaPostres.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 2
      }
    });

    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaPostres.id,
          nombre: 'Helado de Vainilla'
        }
      },
      update: {},
      create: {
        nombre: 'Helado de Vainilla',
        descripcion: 'Tres bolas de helado artesanal de vainilla',
        precio: 6.99,
        categoriaId: categoriaPostres.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 3
      }
    });

    await prisma.producto.upsert({
      where: {
        restauranteId_categoriaId_nombre: {
          restauranteId: restauranteDemo.id,
          categoriaId: categoriaPostres.id,
          nombre: 'Brownie con Helado'
        }
      },
      update: {},
      create: {
        nombre: 'Brownie con Helado',
        descripcion: 'Brownie de chocolate caliente con helado de vainilla',
        precio: 7.99,
        categoriaId: categoriaPostres.id,
        restauranteId: restauranteDemo.id,
        disponible: true,
        orden: 4
      }
    });

    // Crear mesas de ejemplo
    console.log('🪑 Creando mesas de ejemplo...');
    
    for (let i = 1; i <= 5; i++) {
      const qrCode = `table-${restauranteDemo.id}-${i}-${Date.now()}`;
      
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
          descripcion: `Mesa para 4 personas - Área principal`,
          qrCode: qrCode,
          restauranteId: restauranteDemo.id,
          activa: true
        }
      });
    }

    console.log('✅ Seed completado exitosamente!');
    console.log('');
    console.log('📊 Datos creados:');
    console.log(`   • 3 planes (Gratuito, Básico, Premium)`);
    console.log(`   • 1 restaurante de demostración`);
    console.log(`   • 1 superusuario: ${process.env.SUPER_USER_EMAIL || 'admin@digitalmenu.com'}`);
    console.log(`   • 1 mesero de ejemplo: mesero@demo.com`);
    console.log(`   • 4 categorías con productos de ejemplo`);
    console.log(`   • 13 productos de muestra`);
    console.log(`   • 5 mesas con códigos QR`);
    console.log('');
    console.log('🔐 Credenciales de acceso:');
    console.log(`   Admin: ${process.env.SUPER_USER_EMAIL || 'admin@digitalmenu.com'} / ${process.env.SUPER_USER_PASSWORD || 'admin123'}`);
    console.log(`   Mesero: mesero@demo.com / mesero123`);

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 