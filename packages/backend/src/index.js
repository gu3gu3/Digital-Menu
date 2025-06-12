const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { connectDB } = require('./config/database');

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

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to database
connectDB();

// Security middleware - Configure Helmet to allow images
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

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  }
});
app.use('/api/', limiter);

// CORS configuration
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

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files (for uploaded images) - MOVED BEFORE API routes for better performance
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    // Set proper headers for images
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