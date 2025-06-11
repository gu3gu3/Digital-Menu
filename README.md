# 🍽️ Digital Menu QR - Sistema de Menús Digitales

**Estado:** MVP + Super Admin System + Plans Management ✅  
**Progreso:** 95% Completado - Listo para Producción  
**Base de Datos:** PostgreSQL (No requiere Docker)

## 📋 Descripción del Proyecto

Sistema completo de menús digitales con códigos QR para restaurantes, incluyendo gestión de suscripciones y administración centralizada. Los clientes escanean códigos QR en las mesas para acceder al menú digital y realizar pedidos en tiempo real.

## ✨ Características Principales

### 🏪 **Para Restaurantes**
- ✅ **Registro y autenticación** segura
- ✅ **Gestión completa del restaurante** (info, horarios, contacto)
- ✅ **Gestión de menú digital** (categorías, productos, precios, imágenes)
- ✅ **Sistema de mesas** con códigos QR únicos
- ✅ **Órdenes en tiempo real** con estados actualizables
- ✅ **Gestión de personal** (meseros, permisos)
- ✅ **Dashboard analítico** con métricas clave
- ✅ **Planes de suscripción** dinámicos

### 👑 **Super Admin System**
- ✅ **Dashboard centralizado** con estadísticas completas
- ✅ **Gestión de suscripciones** (CRUD, filtros, búsqueda)
- ✅ **Sistema de renovación** con descuentos progresivos (5%-20%)
- ✅ **Notificaciones masivas** personalizables
- ✅ **Sincronización de datos** automática
- ✅ **Procesamiento de pagos** manuales
- ✅ **⭐ NUEVO: Gestión Completa de Planes**
  - Crear, editar, activar/desactivar planes
  - Límites configurables (productos, mesas, meseros, órdenes)
  - Estadísticas de uso en tiempo real
  - Protección contra eliminación de planes en uso
  - Precios flexibles (gratuito a premium)

### 🎯 **Para Clientes**
- ✅ **Menú digital responsive** accesible por QR
- ✅ **Navegación intuitiva** por categorías
- ✅ **Información detallada** de productos
- ✅ **Proceso de pedido** simplificado

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** + Express.js
- **Prisma ORM** para base de datos
- **PostgreSQL** (funciona sin Docker)
- **JWT** para autenticación segura
- **Joi** para validaciones
- **Bcrypt** para hash de contraseñas

### Frontend
- **React** + Vite
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Axios** para llamadas API
- **React Hooks** para gestión de estado

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd Digital-Menu
```

### 2. Configurar Backend
```bash
cd packages/backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

**Variables de entorno requeridas (.env):**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/digital_menu"
JWT_SECRET="tu_jwt_secret_seguro_aqui"
JWT_EXPIRES_IN="7d"
SUPER_ADMIN_JWT_SECRET="super_admin_secret_muy_seguro"
SUPER_ADMIN_JWT_EXPIRES_IN="24h"
PORT=3001
```

### 3. Configurar Base de Datos
```bash
# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma db push

# (Opcional) Ver datos con Prisma Studio
npx prisma studio
```

### 4. Configurar Frontend
```bash
cd ../frontend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL de tu backend
```

**Variables de entorno Frontend (.env):**
```bash
VITE_API_URL="http://localhost:3001/api"
```

### 5. Ejecutar en Desarrollo
```bash
# Terminal 1: Backend
cd packages/backend
npm run dev

# Terminal 2: Frontend
cd packages/frontend
npm run dev
```

## 🌐 URLs de Acceso

### Aplicación
- **Landing Page**: http://localhost:5173/
- **Demo**: http://localhost:5173/demo
- **Admin Login**: http://localhost:5173/admin/login
- **Menú Público**: http://localhost:5173/menu/[slug-restaurante]

### Super Admin
- **Login**: http://localhost:5173/super-admin/login
- **Dashboard**: http://localhost:5173/super-admin/dashboard
- **Suscripciones**: http://localhost:5173/super-admin/subscriptions
- **⭐ Gestión de Planes**: http://localhost:5173/super-admin/plans

## 🔐 Credenciales de Acceso

### Super Administrador
```
Email: admin@menuview.app
Password: SuperAdmin123!
```

### Restaurantes Demo
```
Don Ceviche:
Email: admin@donceviche.com
Password: Admin123!

Bella Vista:
Email: admin@bellavista.com  
Password: Admin123!

Casa Marina:
Email: admin@casamarina.com
Password: Admin123!
```

## 📊 Funcionalidades del Super Admin

### Dashboard Principal
- 📈 **Estadísticas en tiempo real**
- 📋 **Suscripciones próximas a vencer**
- 💰 **Ingresos del mes**
- 📊 **Distribución por planes**

### **🆕 Gestión de Planes** (`/super-admin/plans`)
- **Crear planes personalizados** con límites flexibles
- **Editar planes existentes** (precios, límites, descripción)
- **Activar/Desactivar planes** sin perder historial
- **Eliminar planes** con validación de uso
- **Ver estadísticas de uso** (restaurantes, suscripciones)
- **Límites configurables**: productos, mesas, meseros, órdenes/mes
- **Soporte para ilimitado** (valor -1)

### Gestión de Suscripciones
- **Lista completa** con filtros avanzados
- **Renovación inteligente** con descuentos automáticos
- **Cambio de planes** durante renovación
- **Procesamiento de pagos** manuales
- **Sincronización automática** de datos

### Sistema de Notificaciones
- **Notificaciones masivas** personalizables
- **Tipos predefinidos**: renovación, vencimiento, pago confirmado
- **Historial completo** de notificaciones enviadas

## 💾 Estructura de Base de Datos

### Modelos Principales
- **Plan**: Configuración de planes de suscripción
- **Restaurante**: Información y configuración del restaurante
- **Suscripcion**: Estado y fechas de suscripciones
- **HistorialPago**: Registro de todos los pagos
- **SuperUsuario**: Administradores del sistema
- **NotificacionUsuario**: Notificaciones enviadas

## 🔄 Sistema de Renovación

### Descuentos Automáticos
```
1 mes:  0% descuento
3 meses: 5% descuento  
6 meses: 10% descuento
9 meses: 15% descuento
12 meses: 20% descuento
```

### Características
- ✅ **Renovación desde cualquier estado** (activa, vencida, suspendida)
- ✅ **Cambio de plan** durante renovación
- ✅ **Transacciones atómicas** para consistencia
- ✅ **Notificaciones automáticas** al usuario

## 🛡️ Seguridad Implementada

- ✅ **Autenticación JWT** con tokens separados para usuarios y super admin
- ✅ **Middleware de autorización** en todas las rutas protegidas
- ✅ **Validación de datos** con Joi en backend
- ✅ **Hash de contraseñas** con bcrypt
- ✅ **Interceptores automáticos** en frontend para manejo de tokens
- ✅ **Protección contra eliminación** de datos críticos

## 📝 Scripts Disponibles

### Backend
```bash
npm run dev          # Servidor de desarrollo
npm run start        # Servidor de producción
npm run db:generate  # Generar cliente Prisma
npm run db:push      # Aplicar cambios a BD
npm run db:studio    # Abrir Prisma Studio
```

### Frontend
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Vista previa del build
npm run lint         # Linter ESLint
```

## 🎨 Características de UI/UX

- 📱 **Completamente responsive** (móvil, tablet, desktop)
- 🎨 **Diseño moderno** con Tailwind CSS
- ⚡ **Carga rápida** con Vite
- 🔄 **Estados de carga** y feedback visual
- ✅ **Validaciones en tiempo real**
- 🎯 **Navegación intuitiva**

## 📈 Estado de Completitud

| Módulo | Estado | Progreso |
|--------|--------|----------|
| Sistema Base MVP | ✅ Completo | 100% |
| Super Admin System | ✅ Completo | 100% |
| **Gestión de Planes** | ✅ **Completo** | **100%** |
| Autenticación | ✅ Completo | 100% |
| Validaciones | ✅ Completo | 100% |
| Documentación | ✅ Completo | 100% |

## 🚀 Listo para Producción

El sistema está **completamente funcional** y listo para producción:

- ✅ **Base de datos optimizada** sin dependencia de Docker
- ✅ **APIs robustas** con validaciones completas
- ✅ **Frontend responsive** y optimizado
- ✅ **Sistema de autenticación** seguro
- ✅ **Gestión completa de planes** implementada
- ✅ **Documentación técnica** completa
- ✅ **Manejo de errores** implementado

## 📞 Soporte

Para soporte técnico o preguntas sobre el sistema:
- Revisar la documentación en `TECHNICAL_REFERENCE.md`
- Consultar el estado del proyecto en `PROJECT-STATUS.md`
- Ver tareas pendientes en `TODO.md`

---

**Desarrollado con ❤️ para modernizar la experiencia gastronómica** 