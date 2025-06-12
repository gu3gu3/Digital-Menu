const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const host = process.env.DB_SOCKET_PATH;
  
  const connectionString = `postgresql://${user}:${password}@localhost/${database}?host=${host}`;

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
    log: ['error'],
    errorFormat: 'pretty',
  });

} else {
  // Configuración para desarrollo
  prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty',
  });
}

const connectDB = async () => {
  try {
    // Test the connection
    await prisma.$connect();
    console.log('✅ Base de datos conectada correctamente');
    
    return prisma;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  if (prisma) {
    await prisma.$disconnect();
    console.log('🔌 Desconectado de la base de datos');
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando aplicación...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Cerrando aplicación...');
  await disconnectDB();
  process.exit(0);
});

module.exports = {
  connectDB,
  disconnectDB,
  prisma
}; 