const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { connectDB } = require('./config/database');

// --- PASO DE DEPURACIÓN FINAL ---
console.log("===================================");
console.log("INICIANDO SERVIDOR - VERIFICANDO VARIABLES DE ENTORNO");
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
// Por seguridad, solo confirmamos si las variables existen, no imprimimos sus valores.
console.log(`DATABASE_URL (definida?): ${process.env.DATABASE_URL ? 'Sí' : 'NO'}`);
console.log(`JWT_SECRET (definido?): ${process.env.JWT_SECRET ? 'Sí' : 'NO'}`);
console.log("===================================");
// --- FIN DEL PASO DE DEPURACIÓN ---

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

const app = express();
// En producción (dentro de Docker), siempre usaremos 3001 para el backend,
// ya que Nginx es quien expone el puerto 8080 al exterior.
const PORT = process.env.NODE_ENV === 'production' ? 3001 : (process.env.PORT || 3001);

// =================================================================
//  Middleware Setup
// =================================================================

// 1. CORS Configuration (Apply First!)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://menuview.app',
  'https://www.menuview.app'
];

if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Connect to database
connectDB();

// 3. Security Middleware
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

// 4. Rate limiting
if (process.env.NODE_ENV !== 'development') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, // Límite de 200 solicitudes por IP por ventana
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  });
  app.use(limiter);
}

// 5. Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

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

// Serve static files (for uploaded images)
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

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
app.use('/api/notifications', notificationRoutes);

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
      superAdmin: '/api/super-admin'
    },
    health: '/health',
    documentation: 'Próximamente con Swagger'
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
  console.log(`📖 API docs: http://localhost:${PORT}/api`);
});

module.exports = app; 