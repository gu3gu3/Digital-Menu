# 🔧 Referencia Técnica - Digital Menu QR

**Actualizado:** Junio 2025  
**Versión:** 1.0.0  

---

## 📋 **Stack Tecnológico Completo**

### **Backend - Node.js + Express**
```bash
Puerto: 3001
Tecnologías principales:
├── Express 4.18+ (Framework web)
├── Prisma 5.x (ORM y migraciones)
├── PostgreSQL (Base de datos)
├── JWT (Autenticación)
├── bcryptjs (Hash de passwords)
├── Joi (Validación de datos)
├── Multer (Subida de archivos)
├── Helmet (Seguridad HTTP)
├── CORS (Cross-Origin Resource Sharing)
├── Nodemailer (Envío de emails)
├── Jest (Testing framework)
└── Docker (Desarrollo local)
```

### **Frontend - React + Vite**
```bash
Puerto: 5173/5174
Tecnologías principales:
├── React 18+ (Biblioteca UI)
├── Vite (Build tool y dev server)
├── React Router 6 (Enrutamiento)
├── TailwindCSS (Framework CSS)
├── Heroicons (Iconografía)
├── ESLint + Prettier (Code quality)
└── Axios (Cliente HTTP)
```

---

## 🗄️ **Esquema de Base de Datos (Actualizado)**

A continuación se detalla el esquema de la base de datos PostgreSQL, gestionado a través de Prisma. Este esquema representa la "fuente de la verdad" para la estructura de datos de toda la aplicación.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Modelos de la aplicación

model Plan {
  id               String       @id @default(cuid())
  nombre           String       @unique
  precio           Float
  limiteProductos  Int
  limiteCategorias Int
  limiteMeseros    Int          @default(0) // Renombrado desde limiteUsuarios
  limiteMesas      Int          @default(0) // Límite de mesas
  limiteOrdenes    Int          @default(0) // Límite de órdenes mensuales
  soporteEmail     Boolean      @default(false)
  soporteChat      Boolean      @default(false)
  analiticas       Boolean      @default(false)
  activo           Boolean      @default(true)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  restaurantes     Restaurante[]
  @@map("planes")
}

model Restaurante {
  id                String       @id @default(cuid())
  nombre            String
  slug              String       @unique
  descripcion       String?      @db.Text
  telefono          String?
  direccion         String?
  email             String?      @unique
  logoUrl           String?
  bannerUrl         String?
  backgroundImage   String?
  backgroundColor   String?
  moneda            String       @default("USD")
  activo            Boolean      @default(true)
  configuracion     Json?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  planId            String
  plan              Plan         @relation(fields: [planId], references: [id])
  
  usuariosAdmin     UsuarioAdmin[]
  usuariosMesero    UsuarioMesero[]
  mesas             Mesa[]
  categorias        Categoria[]
  productos         Producto[]
  ordenes           Orden[]
  sesiones          Sesion[]
  notificaciones    NotificacionUsuario[]

  suscripcion       Suscripcion?
  @@map("restaurantes")
}

model UsuarioAdmin {
  id                String       @id @default(cuid())
  email             String       @unique
  password          String
  nombre            String
  apellido          String?
  telefono          String?
  activo            Boolean      @default(true)
  emailVerificado   Boolean      @default(false)
  lastLogin         DateTime?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  restauranteId     String
  restaurante       Restaurante  @relation(fields: [restauranteId], references: [id], onDelete: Cascade)
  
  @@map("usuarios_admin")
}

model UsuarioMesero {
  id                String       @id @default(cuid())
  email             String       @unique
  password          String
  nombre            String
  apellido          String?
  telefono          String?
  pin               String?
  activo            Boolean      @default(true)
  lastLogin         DateTime?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  restauranteId     String
  restaurante       Restaurante  @relation(fields: [restauranteId], references: [id], onDelete: Cascade)
  ordenes           Orden[]      // Un mesero puede tener muchas órdenes asignadas
  
  @@map("usuarios_mesero")
}

model Mesa {
  id                String       @id @default(cuid())
  nombre            String
  numero            Int
  capacidad         Int          @default(1)
  activo            Boolean      @default(true)
  qrCodeUrl         String?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  restauranteId     String
  restaurante       Restaurante  @relation(fields: [restauranteId], references: [id], onDelete: Cascade)
  ordenes           Orden[]      // Una mesa puede tener muchas órdenes
  sesiones          Sesion[]     // Una mesa puede tener muchas sesiones

  @@unique([restauranteId, numero])
  @@map("mesas")
}

model Categoria {
  id                String       @id @default(cuid())
  nombre            String
  descripcion       String?
  activa            Boolean      @default(true)
  orden             Int          @default(0)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  restauranteId     String
  restaurante       Restaurante  @relation(fields: [restauranteId], references: [id], onDelete: Cascade)
  productos         Producto[]

  @@unique([restauranteId, nombre])
  @@map("categorias")
}

model Producto {
  id                String       @id @default(cuid())
  nombre            String
  descripcion       String?      @db.Text
  precio            Float
  imagenUrl         String?
  disponible        Boolean      @default(true)
  orden             Int          @default(0)
  esDestacado       Boolean      @default(false)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  categoriaId       String
  categoria         Categoria    @relation(fields: [categoriaId], references: [id], onDelete: Cascade)
  itemsOrden        ItemOrden[]

  restauranteId     String
  restaurante       Restaurante  @relation(fields: [restauranteId], references: [id], onDelete: Cascade)

  @@unique([restauranteId, nombre])
  @@map("productos")
}

model Orden {
  id                String       @id @default(cuid())
  numeroOrden       Int
  estado            String       @default("PENDIENTE") // PENDIENTE, EN_PROCESO, COMPLETADA, CANCELADA
  subtotal          Float
  impuestos         Float        @default(0)
  total             Float
  notas             String?
  nombreClienteFactura String?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  restauranteId     String
  restaurante       Restaurante  @relation(fields: [restauranteId], references: [id], onDelete: Cascade)
  
  mesaId            String
  mesa              Mesa         @relation(fields: [mesaId], references: [id])
  
  sesionId          String?
  sesion            Sesion?      @relation(fields: [sesionId], references: [id])

  meseroId          String?
  mesero            UsuarioMesero? @relation(fields: [meseroId], references: [id], onDelete: SetNull)
  
  items             ItemOrden[]

  @@unique([restauranteId, numeroOrden])
  @@map("ordenes")
}

model ItemOrden {
  id                String       @id @default(cuid())
  cantidad          Int
  precioUnitario    Float
  subtotal          Float
  notas             String?
  
  ordenId           String
  orden             Orden        @relation(fields: [ordenId], references: [id], onDelete: Cascade)
  productoId        String
  producto          Producto     @relation(fields: [productoId], references: [id])

  @@map("items_orden")
}

model Sesion {
  id                String       @id @default(cuid())
  activa            Boolean      @default(true)
  createdAt         DateTime     @default(now())
  
  clienteNombre     String?
  clienteTelefono   String?
  numeroPersonas    Int?
  ultimaActividad   DateTime?
  finSesion         DateTime?

  mesaId            String
  mesa              Mesa         @relation(fields: [mesaId], references: [id])
  restauranteId     String
  restaurante       Restaurante  @relation(fields: [restauranteId], references: [id])
  ordenes           Orden[]
  
  @@map("sesiones")
}

model Suscripcion {
  id                String       @id @default(cuid())
  estado            String       @default("ACTIVA") // ACTIVA, VENCIDA, CANCELADA
  fechaInicio       DateTime
  fechaVencimiento  DateTime
  renovacionAutomatica Boolean   @default(true)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  restauranteId     String       @unique
  restaurante       Restaurante  @relation(fields: [restauranteId], references: [id], onDelete: Cascade)
  historialPagos    HistorialPago[]
  
  @@map("suscripciones")
}

model HistorialPago {
  id                String       @id @default(cuid())
  suscripcionId     String
  monto             Decimal
  mesesPagados      Int
  fechaPago         DateTime     @default(now())
  metodoPago        String?
  referenciaPago    String?
  procesadoPor      String?
  notas             String?
  createdAt         DateTime     @default(now())
  
  suscripcion       Suscripcion  @relation(fields: [suscripcionId], references: [id], onDelete: Cascade)
  
  @@map("historial_pagos")
}

model SuperUsuario {
  id                String       @id @default(cuid())
  email             String       @unique
  password          String
  nombre            String
  rol               String       @default("ADMIN") // ADMIN, SOPORTE
  activo            Boolean      @default(true)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  @@map("super_usuarios")
}

model NotificacionUsuario {
  id                String       @id @default(cuid())
  tipo              String       // ORDEN_NUEVA, ORDEN_CANCELADA, MESA_LIBERADA
  titulo            String
  mensaje           String
  leida             Boolean      @default(false)
  createdAt         DateTime     @default(now())
  
  notificationKey   String?
  restauranteId     String
  restaurante       Restaurante  @relation(fields: [restauranteId], references: [id], onDelete: Cascade)
  
  enviadaPorId      String?
  
  @@map("notificaciones_usuario")
}

```

---

## 🔗 **APIs Principales Implementadas**

### **🔐 Autenticación** (`/api/auth`)
```bash
POST   /api/auth/register    # Registro de admin
POST   /api/auth/login       # Login con JWT
POST   /api/auth/verify      # Verificar email
GET    /api/auth/me          # Obtener usuario actual
```

### **🏪 Restaurantes** (`/api/restaurant`)
```bash
GET    /api/restaurant       # Obtener restaurante del admin
PUT    /api/restaurant       # Actualizar restaurante
POST   /api/restaurant/logo  # Subir logo
POST   /api/restaurant/banner # Subir banner
```

### **📋 Productos y Categorías** (`/api/products`, `/api/categories`)
```bash
# Productos
GET    /api/products         # Listar productos
POST   /api/products         # Crear producto
PUT    /api/products/:id     # Actualizar producto
DELETE /api/products/:id     # Eliminar producto
POST   /api/products/:id/image # Subir imagen

# Categorías
GET    /api/categories       # Listar categorías
POST   /api/categories       # Crear categoría
PUT    /api/categories/:id   # Actualizar categoría
DELETE /api/categories/:id   # Eliminar categoría
```

### **🪑 Mesas** (`/api/tables`)
```bash
GET    /api/tables           # Listar mesas
POST   /api/tables           # Crear mesa
PUT    /api/tables/:id       # Actualizar mesa
DELETE /api/tables/:id       # Eliminar mesa
```

### **🛒 Sistema de Carrito** ⭐ (`/api/cart`)
```bash
GET    /api/cart/:sessionToken              # Ver carrito
POST   /api/cart/:sessionToken/add          # Agregar producto
PUT    /api/cart/:sessionToken/item/:itemId # Actualizar item
DELETE /api/cart/:sessionToken/item/:itemId # Eliminar item
DELETE /api/cart/:sessionToken/clear        # Vaciar carrito
POST   /api/cart/:sessionToken/confirm      # Confirmar pedido
```

### **🎫 Sesiones** (`/api/sessions`)
```bash
POST   /api/sessions/create  # Crear sesión de mesa
GET    /api/sessions/:token  # Obtener sesión por token
PUT    /api/sessions/:token  # Actualizar sesión
```

### **📦 Órdenes** (`/api/orders`)
```bash
GET    /api/orders           # Listar órdenes del restaurante
GET    /api/orders/:id       # Obtener orden específica
PUT    /api/orders/:id       # Actualizar estado de orden
```

### **🌐 APIs Públicas** (`/api/public`)
```bash
GET    /api/public/menu/:slug              # Menú público por slug
GET    /api/public/menu/:slug/categories   # Categorías públicas
GET    /api/public/menu/:slug/products     # Productos públicos
```

### **👑 APIs de Super Administrador** ⭐ **NUEVO** (`/api/super-admin`)
```bash
# Autenticación
POST   /api/super-admin/auth/login         # Login de super admin
GET    /api/super-admin/auth/profile       # Perfil de super admin
POST   /api/super-admin/auth/logout        # Logout de super admin

# Gestión de Suscripciones
GET    /api/super-admin/subscriptions      # Listar suscripciones con filtros
GET    /api/super-admin/subscriptions/stats # Estadísticas generales
GET    /api/super-admin/subscriptions/:id  # Obtener suscripción específica
PUT    /api/super-admin/subscriptions/:id  # Actualizar suscripción
POST   /api/super-admin/subscriptions/:id/renew # Renovar suscripción

# Gestión de Planes
GET    /api/super-admin/subscriptions/plans # Obtener planes disponibles

# Notificaciones
POST   /api/super-admin/subscriptions/send-notifications # Enviar notificaciones masivas

# Sincronización
POST   /api/super-admin/subscriptions/sync-restaurant-plans # Sincronizar planes
```

#### **Ejemplo de Respuesta - Estadísticas de Super Admin**
```json
{
  "success": true,
  "data": {
    "totalSuscripciones": 150,
    "suscripcionesActivas": 142,
    "suscripcionesVencidas": 5,
    "suscripcionesBloqueadas": 3,
    "ingresosMensuales": 12500.00,
    "suscripcionesPorPlan": [
      {
        "planId": "GRATUITO",
        "planNombre": "Plan Gratuito", 
        "cantidad": 80
      },
      {
        "planId": "BASICO",
        "planNombre": "Plan Básico",
        "cantidad": 45
      },
      {
        "planId": "PREMIUM", 
        "planNombre": "Plan Premium",
        "cantidad": 25
      }
    ]
  }
}
```

#### **Sistema de Renovación de Suscripciones**
```json
// Request body para renovación:
{
  "meses": 3,           // 1, 3, 6, 9, 12 meses
  "planId": "PREMIUM",  // Opcional: cambiar plan
  "monto": 250.00,
  "metodoPago": "Transferencia",
  "referenciaPago": "TXN-123456",
  "notas": "Renovación con descuento"
}

// Descuentos automáticos por período:
// 1 mes: 0% descuento
// 3 meses: 5% descuento  
// 6 meses: 10% descuento
// 9 meses: 15% descuento
// 12 meses: 20% descuento
```

---

## 📊 **Sistema de Gestión de Estados**

### **Estados de Sesión**
```javascript
ACTIVA   // Sesión activa, carrito disponible
CERRADA  // Sesión cerrada, no se puede modificar carrito
```

### **Estados de Orden**
```javascript
ENVIADA       // Orden enviada por el cliente
RECIBIDA      // Confirmada por el restaurante
EN_PREPARACION // En cocina
LISTA         // Listo para servir
SERVIDA       // Entregado al cliente
CANCELADA     // Cancelado por algún motivo
```

### **Flujo de Estados**
```
Cliente escanea QR → Sesión ACTIVA creada
Cliente agrega productos → Carrito en metadata de sesión
Cliente confirma pedido → Orden ENVIADA creada
Staff confirma → RECIBIDA → EN_PREPARACION → LISTA → SERVIDA
```

---

## 🛒 **Estructura del Carrito en Sesión**

El carrito se almacena en el campo `metadata` de la sesión como JSON:

```json
{
  "carrito": {
    "items": [
      {
        "id": "uuid-item-1",
        "productoId": 15,
        "nombre": "Hamburguesa Clásica",
        "precio": 12.50,
        "cantidad": 2,
        "subtotal": 25.00,
        "notas": "Sin cebolla"
      }
    ],
    "subtotal": 25.00,
    "total": 25.00,
    "fechaActualizacion": "2025-06-XX T XX:XX:XX.XXXZ"
  }
}
```

---

## 🛒 **Sistema de Seguridad**

### **Autenticación JWT**
```javascript
// Configuración JWT
JWT_SECRET="secret-key"
JWT_EXPIRES_IN="7d"

// Headers requeridos
Authorization: Bearer <token>
```

### **Middleware de Seguridad**
```javascript
// Helmet configurado
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      'img-src': ["'self'", 'localhost:3001', 'data:', 'blob:']
    }
  }
}));

// CORS configurado
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Rate limiting
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por ventana
}));
```

---

## 📧 **Configuración de Email**

### **STARTTLS con Nodemailer**
```javascript
const transporter = nodemailer.createTransport({
  host: 'mail.menuview.app',
  port: 587,
  secure: false, // false para STARTTLS
  requireTLS: true,
  auth: {
    user: 'registro@menuview.app',
    pass: '1MZfKyxUrRg3YsGN'
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  }
});
```

### **Templates de Email**
- **Verificación de cuenta**: HTML profesional con enlace de activación
- **Modo desarrollo**: Fallback a `console.log` si falla SMTP

---

## 🧪 **Testing Framework**

### **Configuración Jest**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js'
  ]
};
```

### **Tests Implementados**
```bash
✅ Auth endpoints (register, login, verify)
✅ Restaurant CRUD operations
✅ Product and category management
✅ Table management
✅ Session creation and management ⭐
✅ Cart operations (add, update, remove, confirm) ⭐
✅ Order creation and status updates
✅ Public menu API
```

---

## 🖼️ **Sistema de Imágenes**

### **Desarrollo Local**
```javascript
// Configuración Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads', folder);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});

// Servir archivos estáticos
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));
```

### **Estructura de Carpetas**
```
packages/backend/uploads/
├── restaurants/        # Logos y banners
│   ├── logo-123456.jpg
│   └── banner-789012.jpg
└── products/          # Imágenes de productos
    ├── product-345678.jpg
    └── product-901234.png
```

---

## 🚀 **Comandos de Desarrollo**

### **Scripts NPM Principales**
```bash
# Desarrollo completo
npm run dev              # Backend + Frontend concurrente

# Desarrollo individual
npm run dev:backend      # Solo backend (puerto 3001)
npm run dev:frontend     # Solo frontend (puerto 5173)

# Base de datos
npm run db:generate      # Generar cliente Prisma
npm run db:migrate       # Ejecutar migraciones
npm run db:seed          # Poblar con datos demo
npm run db:studio        # Abrir Prisma Studio
npm run db:reset         # Reset completo + seed

# Testing
npm test                 # Ejecutar todos los tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Coverage report

# Build
npm run build:backend    # Build backend para producción
npm run build:frontend   # Build frontend para producción
```

### **Docker para Desarrollo**
```bash
# Iniciar base de datos
docker-compose up -d

# Verificar contenedores
docker ps

# Logs de PostgreSQL
docker logs digital-menu-postgres

# Acceder a PgAdmin
# URL: http://localhost:8080
# Email: admin@digitalmenu.com
# Password: admin123
```

---

## 🌐 **URLs de Desarrollo**

### **Backend (puerto 3001)**
```bash
http://localhost:3001/health          # Health check
http://localhost:3001/api/auth/me     # Profile (requiere auth)
http://localhost:3001/uploads/        # Archivos estáticos
```

### **Frontend (puerto 5173)**
```bash
http://localhost:5173/                           # Landing page
http://localhost:5173/admin/login                # Admin login
http://localhost:5173/admin/dashboard            # Admin dashboard
http://localhost:5173/menu/la-parrilla-criolla   # Menú público
http://localhost:5173/menu/[slug]?mesa=1         # Menú con mesa específica
```

### **Credenciales Demo**
```bash
# Super Administrador
Super Admin Email: admin@menuview.app
Password: SuperAdmin123!

# Administrador de Restaurante
Admin Email: admin@laparrillacriolla.com
Password: demo123456
Restaurante Slug: la-parrilla-criolla
```

---

## 📈 **Métricas y Monitoring**

### **Endpoints de Salud**
```javascript
GET /health
Response: {
  "status": "OK",
  "timestamp": "2025-06-XX",
  "database": "connected",
  "version": "1.0.0"
}
```

### **Logs Estructurados**
```javascript
// Winston logger configurado para:
- Development: console con colores
- Production: archivos JSON + stdout
- Error tracking: errores en archivo separado
```

---

**Notas Técnicas:**
- El proyecto usa **workspaces de npm** para gestión de monorepo
- **Prisma** maneja migraciones automáticas en desarrollo
- **CORS** configurado específicamente para dominio frontend
- **Rate limiting** aplicado a todas las rutas `/api`
- **Validación robusta** con Joi en todos los endpoints

---

*Actualizado: $(date +%Y-%m-%d)* 

## Arquitectura del Sistema

### Tecnologías Principales
- **Backend**: Node.js + Express.js
- **ORM**: Prisma
- **Base de Datos**: PostgreSQL  
- **Frontend**: React + Vite + Tailwind CSS
- **Autenticación**: JWT
- **Validaciones**: Joi

### Estructura de Carpetas
```
Digital-Menu/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   ├── utils/
│   │   │   └── prisma/
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── services/
│       │   └── utils/
│       └── package.json
└── README.md
```

## Modelos de Base de Datos (Prisma Schema)

### Plan
```prisma
model Plan {
  id               String        @id @default(cuid())
  nombre           String        @unique
  descripcion      String?
  precio           Decimal       @db.Decimal(10,2)
  limiteProductos  Int           // -1 = ilimitado
  limiteMesas      Int           // -1 = ilimitado  
  limiteMeseros    Int           // -1 = ilimitado
  limiteOrdenes    Int           // -1 = ilimitado
  activo           Boolean       @default(true)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  
  // Relaciones
  restaurantes     Restaurante[]
  suscripciones    Suscripcion[]
}
```

### Suscripcion
```prisma
model Suscripcion {
  id                String          @id @default(cuid())
  restauranteId     String
  planId            String
  estado            EstadoSuscripcion @default(ACTIVA)
  fechaInicio       DateTime        @default(now())
  fechaVencimiento  DateTime
  fechaUltimoPago   DateTime?
  mesesPagados      Int?
  montoUltimoPago   Decimal?        @db.Decimal(10,2)
  notasAdmin        String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  // Relaciones
  restaurante       Restaurante     @relation(fields: [restauranteId], references: [id])
  plan              Plan            @relation(fields: [planId], references: [id])
  historialPagos    HistorialPago[]
}
```

### HistorialPago
```prisma
model HistorialPago {
  id              String      @id @default(cuid())
  suscripcionId   String
  monto           Decimal     @db.Decimal(10,2)
  mesesPagados    Int
  metodoPago      String?
  referenciaPago  String?
  fechaPago       DateTime    @default(now())
  procesadoPor    String      // ID del super usuario
  notas           String?
  createdAt       DateTime    @default(now())
  
  // Relaciones
  suscripcion     Suscripcion @relation(fields: [suscripcionId], references: [id])
  procesadoPorUser SuperUsuario @relation(fields: [procesadoPor], references: [id])
}
```

### SuperUsuario
```prisma
model SuperUsuario {
  id                  String    @id @default(cuid())
  email               String    @unique
  password            String
  nombre              String
  apellido            String
  rol                 String    @default("SUPER_ADMIN")
  activo              Boolean   @default(true)
  lastLogin           DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  // Relaciones
  historialPagos      HistorialPago[]
  notificacionesEnviadas NotificacionUsuario[]
}
```

### NotificacionUsuario
```prisma
model NotificacionUsuario {
  id            String              @id @default(cuid())
  restauranteId String
  tipo          TipoNotificacion
  titulo        String
  mensaje       String
  leida         Boolean             @default(false)
  fechaLeida    DateTime?
  enviadaPorId  String
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  
  // Relaciones
  restaurante   Restaurante         @relation(fields: [restauranteId], references: [id])
  enviadaPor    SuperUsuario        @relation(fields: [enviadaPorId], references: [id])
}
```

### Enums
```prisma
enum EstadoSuscripcion {
  ACTIVA
  VENCIDA
  SUSPENDIDA
  CANCELADA
  BLOQUEADA
}

enum TipoNotificacion {
  RENOVACION_PROXIMA
  SUSCRIPCION_VENCIDA
  CUENTA_SUSPENDIDA
  PAGO_CONFIRMADO
  UPGRADE_PLAN
  BIENVENIDA
}
```

## APIs del Sistema

### Autenticación Super Admin

#### POST /api/super-admin/auth/login
Autenticar super administrador.

**Request Body:**
```json
{
  "email": "admin@menuview.app",
  "password": "SuperAdmin123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "admin@menuview.app",
      "nombre": "Super",
      "apellido": "Admin",
      "rol": "SUPER_ADMIN"
    }
  }
}
```

### **Gestión Completa de Planes** ⭐ NUEVO

#### GET /api/super-admin/subscriptions/plans/all
Obtener todos los planes (activos e inactivos) para administración.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "plan_id_1",
      "nombre": "Plan Gratuito",
      "descripcion": "Plan básico gratuito con funcionalidades esenciales",
      "precio": 0.00,
      "limiteProductos": 50,
      "limiteMesas": 10,
      "limiteMeseros": 1,
      "limiteOrdenes": 200,
      "activo": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "restaurantes": 0,
        "suscripciones": 0
      }
    },
    {
      "id": "plan_id_2",
      "nombre": "Plan Básico",
      "descripcion": "Plan básico comercial con más funcionalidades",
      "precio": 29.99,
      "limiteProductos": 100,
      "limiteMesas": 20,
      "limiteMeseros": 5,
      "limiteOrdenes": 500,
      "activo": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "restaurantes": 1,
        "suscripciones": 1
      }
    }
  ]
}
```

#### POST /api/super-admin/subscriptions/plans
Crear nuevo plan de suscripción.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "nombre": "Plan Enterprise",
  "descripcion": "Plan empresarial con todas las funcionalidades",
  "precio": 99.99,
  "limiteProductos": -1,
  "limiteMesas": -1,
  "limiteMeseros": -1,
  "limiteOrdenes": -1,
  "activo": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Plan creado exitosamente",
  "data": {
    "id": "new_plan_id",
    "nombre": "Plan Enterprise",
    "descripcion": "Plan empresarial con todas las funcionalidades",
    "precio": 99.99,
    "limiteProductos": -1,
    "limiteMesas": -1,
    "limiteMeseros": -1,
    "limiteOrdenes": -1,
    "activo": true,
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

#### PUT /api/super-admin/subscriptions/plans/:id
Actualizar plan existente.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "nombre": "Plan Premium Actualizado",
  "precio": 79.99,
  "descripcion": "Plan premium con funcionalidades mejoradas",
  "limiteProductos": 500,
  "activo": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Plan actualizado exitosamente",
  "data": {
    "id": "plan_id",
    "nombre": "Plan Premium Actualizado",
    "precio": 79.99,
    "descripcion": "Plan premium con funcionalidades mejoradas",
    "limiteProductos": 500,
    "limiteMesas": 50,
    "limiteMeseros": 15,
    "limiteOrdenes": 2000,
    "activo": true,
    "updatedAt": "2024-12-01T12:00:00.000Z"
  }
}
```

#### DELETE /api/super-admin/subscriptions/plans/:id
Eliminar plan (solo si no tiene restaurantes o suscripciones asociadas).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Éxito):**
```json
{
  "success": true,
  "message": "Plan eliminado exitosamente"
}
```

**Response (Error - Plan en uso):**
```json
{
  "success": false,
  "message": "No se puede eliminar un plan que tiene restaurantes o suscripciones asociadas. Desactive el plan en su lugar.",
  "data": {
    "restaurantesAsociados": 5,
    "suscripcionesAsociadas": 3
  }
}
```

#### POST /api/super-admin/subscriptions/plans/:id/toggle
Activar o desactivar un plan.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Plan activado exitosamente",
  "data": {
    "id": "plan_id",
    "nombre": "Plan Básico",
    "activo": true,
    "updatedAt": "2024-12-01T12:00:00.000Z"
  }
}
```

#### GET /api/super-admin/subscriptions/plans/:id/usage
Obtener estadísticas detalladas de uso de un plan específico.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": {
      "id": "plan_id",
      "nombre": "Plan Básico",
      "precio": 29.99
    },
    "estadisticas": {
      "restaurantesAsociados": 5,
      "totalSuscripciones": 7,
      "suscripcionesActivas": 5,
      "ingresosTotales": 899.70
    },
    "restaurantesRecientes": [
      {
        "id": "rest_id_1",
        "nombre": "Restaurante A",
        "email": "admin@restaurantea.com",
        "createdAt": "2024-11-01T00:00:00.000Z",
        "activo": true
      }
    ]
  }
}
```

### Gestión de Suscripciones

#### GET /api/super-admin/subscriptions
Obtener lista de suscripciones con filtros.

**Query Parameters:**
- `estado` - Filtrar por estado (ACTIVA, VENCIDA, SUSPENDIDA, etc.)
- `planId` - Filtrar por plan específico  
- `vencenEn` - Días hasta vencimiento
- `page` - Página para paginación
- `limit` - Límite de resultados por página
- `search` - Búsqueda por nombre de restaurante

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suscripciones": [
      {
        "id": "suscripcion_id",
        "estado": "ACTIVA",
        "fechaVencimiento": "2024-12-31T23:59:59.000Z",
        "diasHastaVencimiento": 30,
        "vencida": false,
        "proximaAVencer": false,
        "restaurante": {
          "id": "restaurante_id",
          "nombre": "Don Ceviche",
          "email": "admin@donceviche.com",
          "slug": "don-ceviche",
          "activo": true
        },
        "plan": {
          "id": "plan_id",
          "nombre": "Plan Premium",
          "precio": 59.99
        },
        "historialPagos": [
          {
            "monto": 59.99,
            "fechaPago": "2024-11-01T00:00:00.000Z"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "pages": 1
    }
  }
}
```

#### POST /api/super-admin/subscriptions/:id/renew
Renovar suscripción con descuentos progresivos.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "meses": 6,
  "planId": "plan_id_nuevo",
  "monto": 299.94,
  "metodoPago": "Tarjeta de Crédito",
  "referenciaPago": "TXN123456",
  "notas": "Renovación con descuento de 6 meses"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Suscripción renovada exitosamente por 6 mes(es)",
  "data": {
    "suscripcionActualizada": {
      "id": "suscripcion_id",
      "estado": "ACTIVA",
      "fechaVencimiento": "2025-06-01T00:00:00.000Z",
      "planId": "plan_id_nuevo",
      "mesesPagados": 6,
      "montoUltimoPago": 299.94
    },
    "pago": {
      "id": "pago_id",
      "monto": 299.94,
      "mesesPagados": 6,
      "metodoPago": "Tarjeta de Crédito"
    }
  }
}
```

### Sistema de Notificaciones

#### POST /api/super-admin/subscriptions/send-notifications
Enviar notificaciones masivas a restaurantes.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "restauranteIds": ["rest_id_1", "rest_id_2", "rest_id_3"],
  "tipo": "RENOVACION_PROXIMA",
  "titulo": "Renovación de Suscripción Próxima",
  "mensaje": "Su suscripción vence en 7 días. Renueve ahora para evitar interrupción del servicio."
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 notificaciones enviadas exitosamente",
  "data": {
    "notificacionesEnviadas": 3,
    "tipo": "RENOVACION_PROXIMA",
    "titulo": "Renovación de Suscripción Próxima"
  }
}
```

### Estadísticas del Sistema

#### GET /api/super-admin/subscriptions/stats
Obtener estadísticas completas del sistema.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resumen": {
      "totalSuscripciones": 25,
      "suscripcionesActivas": 20,
      "suscripcionesVencidas": 3,
      "suscripcionesSuspendidas": 2,
      "proximasAVencer7Dias": 5,
      "proximasAVencer30Dias": 8
    },
    "ingresos": {
      "mesActual": 1299.95
    },
    "distribucionPorPlan": [
      {
        "planId": "plan_id_1",
        "planNombre": "Plan Gratuito",
        "cantidad": 5
      },
      {
        "planId": "plan_id_2", 
        "planNombre": "Plan Básico",
        "cantidad": 10
      },
      {
        "planId": "plan_id_3",
        "planNombre": "Plan Premium", 
        "cantidad": 10
      }
    ]
  }
}
```

## Frontend - Servicios y Componentes

### Servicio Principal: superAdminService.js

```javascript
// Gestión de Planes
export const superAdminService = {
  // Planes Management
  getAllPlans: () => Promise,           // Obtener todos los planes
  createPlan: (planData) => Promise,    // Crear nuevo plan
  updatePlan: (id, planData) => Promise, // Actualizar plan
  deletePlan: (id) => Promise,          // Eliminar plan
  togglePlan: (id) => Promise,          // Activar/Desactivar plan
  getPlanUsage: (id) => Promise,        // Estadísticas de plan
  
  // Suscripciones
  getSubscriptions: (params) => Promise,
  renewSubscription: (id, data) => Promise,
  processPayment: (id, data) => Promise,
  
  // Utilidades
  formatCurrency: (amount) => string,
  formatDate: (date) => string,
  getStatusColor: (status) => string
};
```

### Componente Principal: PlansManagementPage.jsx

```javascript
const PlansManagementPage = () => {
  // Estados para gestión de planes
  const [plans, setPlans] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Funcionalidades implementadas:
  // - Lista de planes con filtros y búsqueda
  // - Modales para crear/editar/eliminar planes
  // - Validaciones de formulario
  // - Gestión de estados de carga
  // - Protección contra eliminación de planes en uso
  // - Activación/Desactivación de planes
  // - Estadísticas en tiempo real
  
  return (
    // Interface completa con tabla, modales y acciones
  );
};
```

## Validaciones y Reglas de Negocio

### Validaciones de Plan (Backend - Joi)
```javascript
const createPlanSchema = Joi.object({
  nombre: Joi.string().min(1).max(100).required(),
  descripcion: Joi.string().max(500).optional(),
  precio: Joi.number().min(0).required(),
  limiteProductos: Joi.number().integer().min(-1).required(), // -1 = ilimitado
  limiteMesas: Joi.number().integer().min(-1).required(),
  limiteMeseros: Joi.number().integer().min(-1).required(),
  limiteOrdenes: Joi.number().integer().min(-1).required(),
  activo: Joi.boolean().default(true)
});
```

### Reglas de Negocio para Planes
1. **Nombres únicos**: No pueden existir dos planes con el mismo nombre
2. **Límites flexibles**: -1 significa ilimitado, números positivos son límites específicos
3. **Protección de eliminación**: No se pueden eliminar planes que tienen restaurantes o suscripciones asociadas
4. **Activación/Desactivación**: Los planes se pueden desactivar sin eliminar para preservar historial
5. **Precios**: Pueden ser 0 (gratuito) o cualquier valor positivo con 2 decimales
6. **Validación de uso**: Antes de eliminar se verifica que no tenga dependencias

### Sistema de Descuentos (Renovaciones)
```javascript
const descuentos = {
  1: 0,    // 0% descuento
  3: 5,    // 5% descuento  
  6: 10,   // 10% descuento
  9: 15,   // 15% descuento
  12: 20   // 20% descuento
};
```

## Configuración de Desarrollo

### Variables de Entorno
```bash
# Backend (.env)
DATABASE_URL="postgresql://user:password@localhost:5432/digital_menu"
JWT_SECRET="tu_jwt_secret_aqui"
JWT_EXPIRES_IN="7d"
SUPER_ADMIN_JWT_SECRET="super_admin_secret"
SUPER_ADMIN_JWT_EXPIRES_IN="24h"

# Frontend (.env)
VITE_API_URL="http://localhost:3001/api"
```

### Scripts de Desarrollo
```bash
# Backend
npm run dev          # Servidor de desarrollo
npm run db:generate  # Generar cliente Prisma
npm run db:push      # Aplicar cambios a BD
npm run db:studio    # Abrir Prisma Studio

# Frontend  
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Vista previa del build
```

## Seguridad y Autenticación

### Middleware de Autenticación
```javascript
const authenticateSuperAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }
    
    const decoded = jwt.verify(token, process.env.SUPER_ADMIN_JWT_SECRET);
    const user = await prisma.superUsuario.findUnique({
      where: { id: decoded.id, activo: true }
    });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no autorizado' });
    }
    
    req.superUser = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};
```

### Interceptores Frontend
```javascript
// Interceptor automático para tokens
superAdminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('superAdminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejo de errores 401
superAdminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('superAdminToken');
      localStorage.removeItem('superAdminUser');
      window.location.href = '/super-admin/login';
    }
    return Promise.reject(error);
  }
);
```

## Notas de Implementación

### Transacciones Atómicas
```javascript
// Ejemplo de renovación con transacción
const resultado = await prisma.$transaction(async (tx) => {
  // Actualizar suscripción
  const suscripcionActualizada = await tx.suscripcion.update({
    where: { id },
    data: { estado: 'ACTIVA', fechaVencimiento: nuevaFecha }
  });
  
  // Actualizar restaurante si cambió el plan
  if (planId !== suscripcion.planId) {
    await tx.restaurante.update({
      where: { id: suscripcion.restauranteId },
      data: { planId }
    });
  }
  
  // Crear registro de pago
  const pago = await tx.historialPago.create({
    data: { suscripcionId: id, monto, mesesPagados }
  });
  
  return { suscripcionActualizada, pago };
});
```

### Performance y Optimización
- **Paginación**: Implementada en todas las listas
- **Índices de BD**: En campos de búsqueda frecuente
- **Consultas optimizadas**: Con `select` específicos para reducir datos
- **Cache de planes**: Los planes se cargan una vez y se mantienen en estado
- **Lazy loading**: Componentes cargados bajo demanda

**El sistema está optimizado para producción y completamente funcional sin Docker.** 