const { PrismaClient } = require('@prisma/client');

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
process.env.EMAIL_SERVICE = 'disabled';  // Disable email service for tests

// Global test database client
global.testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalLog = console.log;

beforeAll(async () => {
  console.error = jest.fn();
  console.log = jest.fn();
  
  // Try to connect to test database
  try {
    await global.testPrisma.$connect();
  } catch (error) {
    console.error('Failed to connect to test database:', error.message);
    throw error;
  }
});

afterAll(async () => {
  console.error = originalError;
  console.log = originalLog;
  try {
    await global.testPrisma.$disconnect();
  } catch (error) {
    // Ignore disconnect errors in tests
  }
});

// Clean up database before each test
beforeEach(async () => {
  try {
    // Clean tables in the right order to avoid foreign key constraints
    await global.testPrisma.itemOrden.deleteMany();
    await global.testPrisma.orden.deleteMany();
    await global.testPrisma.sesion.deleteMany();
    await global.testPrisma.mesa.deleteMany();
    await global.testPrisma.producto.deleteMany();
    await global.testPrisma.categoria.deleteMany();
    await global.testPrisma.usuarioMesero.deleteMany();
    await global.testPrisma.usuarioAdmin.deleteMany();
    await global.testPrisma.restaurante.deleteMany();
    await global.testPrisma.plan.deleteMany();
  } catch (error) {
    console.error('Error cleaning database:', error.message);
    throw error;
  }
});

// Helper function to create test data
global.createTestData = async () => {
  try {
    // Create plan
    const plan = await global.testPrisma.plan.create({
      data: {
        nombre: 'Test Plan',
        descripcion: 'Plan de prueba',
        precio: 50,
        limiteProductos: 100,
        limiteOrdenes: 500,
        limiteMesas: 20,
        limiteMeseros: 5
      }
    });

    // Create restaurant
    const restaurante = await global.testPrisma.restaurante.create({
      data: {
        nombre: 'Test Restaurant',
        slug: 'test-restaurant',
        descripcion: 'Restaurante de prueba',
        email: 'test@restaurant.com',
        planId: plan.id
      }
    });

    // Create admin user
    const admin = await global.testPrisma.usuarioAdmin.create({
      data: {
        email: 'admin@test.com',
        password: '$2a$10$test.hash.password', // Mock hashed password
        nombre: 'Test Admin',
        restauranteId: restaurante.id,
        emailVerificado: true
      }
    });

    // Create test table
    const mesa = await global.testPrisma.mesa.create({
      data: {
        numero: '1',
        nombre: 'Mesa Test',
        descripcion: 'Mesa de prueba',
        capacidad: 4,
        qrCode: 'test-qr-code-123',
        restauranteId: restaurante.id
      }
    });

    return { plan, restaurante, admin, mesa };
  } catch (error) {
    console.error('Error creating test data:', error.message);
    throw error;
  }
}; 