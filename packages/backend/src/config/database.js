const { PrismaClient } = require('@prisma/client');

// Create a single instance that will be used throughout the app
// We explicitly pass the database URL to the constructor,
// overriding the one in the schema.prisma file. This is the most robust
// way to ensure the connection in production environments like App Engine.
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

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