const { PrismaClient } = require('@prisma/client');

// Create a single instance that will be used throughout the app
const prisma = new PrismaClient({
  log: [
    { emit: 'stdout', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
});

const connectDB = async (retries = 5, delay = 5000) => {
  while (retries > 0) {
    try {
      console.log(`🔵 Intentando conectar a la base de datos... (Intentos restantes: ${retries})`);
      await prisma.$connect();
      console.log("✅ Base de datos conectada correctamente");
      return prisma;
    } catch (error) {
      console.error(`❌ Error al conectar a la base de datos:`, error.message);
      retries -= 1;
      if (retries === 0) {
        console.error("❌ Se agotaron los intentos de conexión a la base de datos.");
        process.exit(1);
      }
      console.log(`⏳ Reintentando en ${delay / 1000} segundos...`);
      await new Promise(res => setTimeout(res, delay));
    }
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