const { PrismaClient } = require('@prisma/client');

// Create a single instance that will be used throughout the app
// Se pasa la URL de la base de datos explícitamente para evitar errores de entorno.
// En producción, esta variable viene de los secretos de Cloud Run.
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: [
    { emit: 'stdout', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
});

const connectDB = async () => {
  try {
    console.log("🔵 Intentando conectar a la base de datos...");
    // La conexión ahora se maneja de forma lazy por Prisma.
    // Esta llamada verifica que la conexión es posible.
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Base de datos conectada correctamente");
  } catch (error) {
    console.error("❌ Error al verificar la conexión a la base de datos:", error);
    // No salimos del proceso para permitir que el contenedor se reinicie si es un problema temporal.
    // process.exit(1); 
  }
};

const disconnectDB = async () => {
  if (prisma) {
    await prisma.$disconnect();
    console.log('🔌 Desconectado de la base de datos');
  }
};

// Se elimina el graceful shutdown para simplificar y dejar que el entorno (Cloud Run)
// gestione el ciclo de vida del contenedor.

module.exports = {
  connectDB,
  disconnectDB,
  prisma
}; 