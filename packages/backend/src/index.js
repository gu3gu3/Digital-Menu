console.log("===================================");
console.log("INICIANDO SERVIDOR - VARIABLES DE ENTORNO DISPONIBLES:");
console.log(JSON.stringify(process.env, null, 2));
console.log("===================================");

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { connectDB } = require('./config/database');
const { swaggerSetup } = require('./config/swagger');

// Conectar a la base de datos INMEDIATAMENTE para forzar cualquier error.
connectDB();

// Import routes
const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const tableRoutes = require('./routes/tables');
const sessionRoutes = require('./routes/sessions');
const cartRoutes = require('./routes/cart');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const uploadRoutes = require('./routes/upload');
const menuImportRoutes = require('./routes/menuImport');
const staffRoutes = require('./routes/staff');
const superAdminAuthRoutes = require('./routes/superAdminAuth');
const superAdminSubscriptionsRoutes = require('./routes/superAdminSubscriptions');
const notificationRoutes = require('./routes/notifications');
const aiMenuGeneratorRoutes = require('./routes/aiMenuGenerator');

const app = express();

// Confiar en el primer proxy (esencial para Cloud Run, Heroku, etc.)
// Esto permite que express-rate-limit funcione correctamente al obtener la IP real del cliente.
app.set('trust proxy', 1);

// En producción (dentro de Docker), siempre usaremos 3001 para el backend,
// ya que Nginx es quien expone el puerto 8080 al exterior.
const PORT = process.env.NODE_ENV === 'production' ? 3001 : (process.env.PORT || 3001);

// =================================================================
//  Middleware Setup
// =================================================================

// 0. Log inicial para cada petición
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Petición recibida: ${req.method} ${req.originalUrl}`);
  next();
});

// 1. CORS Configuration (Apply First!)
const allowedOriginsRegex = /(^https:\/\/(.*\.)?menuview\.app$)|(^https:\/\/(.*\.)?run\.app$)|(^http:\/\/localhost:)/;

console.log('Checkpoint 1: Configurando CORS...');
app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (apps de escritorio, curl) o que coincidan con nuestra regex.
    if (!origin || allowedOriginsRegex.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
console.log('Checkpoint 2: CORS aplicado.');

// 2. Connect to database

// 3. Security Middleware
console.log('Checkpoint 3: Configurando Helmet y Compresión...');
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'http://localhost:3001', 'http://localhost:5173', 'data:', 'blob:'],
      'connect-src': ["'self'", 'http://localhost:3001', 'http://localhost:5173']
    }
  }
}));
app.use(compression());
console.log('Checkpoint 4: Helmet y Compresión aplicados.');

// 4. Rate limiting
if (process.env.NODE_ENV !== 'development') {
  console.log('Checkpoint 5: Configurando Rate Limiter...');
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, // Límite de 200 solicitudes por IP por ventana
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  });
  app.use(limiter);
  console.log('Checkpoint 6: Rate Limiter aplicado.');
}

// 5. Body parsing middleware
console.log('Checkpoint 7: Configurando Body Parser...');
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
console.log('Checkpoint 8: Body Parser aplicado.');

// 6. Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Servir archivos estáticos desde la carpeta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// =================================================================
// Routes
// =================================================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/menu-import', menuImportRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/super-admin/auth', superAdminAuthRoutes);
app.use('/api/super-admin/subscriptions', superAdminSubscriptionsRoutes);
app.use('/api/super-admin/ai-menu-generator', aiMenuGeneratorRoutes);
app.use('/api/notifications', notificationRoutes);

// Setup Swagger documentation
swaggerSetup(app);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'API de Menú Digital QR',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      restaurants: '/api/restaurants',
      menu: '/api/menu',
      orders: '/api/orders',
      tables: '/api/tables',
      sessions: '/api/sessions',
      cart: '/api/cart',
      admin: '/api/admin',
      public: '/api/public',
      categories: '/api/categories',
      products: '/api/products',
      upload: '/api/upload',
      menuImport: '/api/menu-import',
      staff: '/api/staff',
      superAdmin: '/api/super-admin',
      aiMenuGenerator: '/api/super-admin/ai-menu-generator'
    },
    health: '/health',
    documentation: '/api/docs'
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📱 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🤖 AI Menu Generator: http://localhost:${PORT}/api/super-admin/ai-menu-generator`);
});

module.exports = app; 