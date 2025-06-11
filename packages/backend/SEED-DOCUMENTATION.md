# 📖 Documentación del Seed Unificado - Digital Menu QR

## Descripción General

El seed unificado (`seed-unified.js`) es el script principal para inicializar la base de datos del sistema Digital Menu QR con todos los datos necesarios para un entorno de desarrollo y demostración completo.

## ¿Qué Crea el Seed?

### 1. 📋 **Planes del Sistema**
- **Plan Gratuito**: $0 (50 productos, 10 mesas, 2 meseros)
- **Plan Básico**: $29.99 (100 productos, 20 mesas, 5 meseros)  
- **Plan Premium**: $59.99 (500 productos, 50 mesas, 15 meseros)

### 2. 👑 **Super Usuario Administrador**
- Administrador del sistema con acceso completo
- Gestión de suscripciones y planes
- Dashboard de estadísticas

### 3. 🏪 **Restaurantes Demo con Multi-Moneda**
- **La Parrilla Criolla** (Moneda: USD, Plan: Básico)
- **Don Ceviche** (Moneda: NIO, Plan: Premium)
- **Bella Vista** (Moneda: CRC, Plan: Gratuito)

### 4. 👨‍💼 **Usuarios Administradores**
- Un admin por cada restaurante con acceso completo
- Emails verificados y contraseñas hasheadas

### 5. 💳 **Suscripciones Activas**
- Suscripción automática para cada restaurante
- Estados activos con fechas de vencimiento
- Notificaciones de bienvenida

### 6. 🍽️ **Datos de Menú Demo**
- 5 categorías de productos
- 10 productos con precios realistas
- 12 mesas con diferentes capacidades
- QR codes únicos generados

---

## 🚀 Cómo Ejecutar el Seed

### Opción 1: Comando Prisma (Recomendado)
```bash
cd packages/backend
npx prisma db seed
```

### Opción 2: Ejecución Directa
```bash
cd packages/backend
node seed-unified.js
```

### Opción 3: Script NPM
```bash
cd packages/backend
npm run db:seed
```

---

## 🔑 Credenciales Generadas

### 👑 **Super Administrador del Sistema**
```
📧 Email: admin@menuview.app
🔐 Password: SuperAdmin123!
🌐 URL: http://localhost:5173/super-admin/login
```

**Funcionalidades:**
- Dashboard con estadísticas del sistema
- Gestión completa de suscripciones
- Administración de planes
- Envío de notificaciones masivas
- Procesamiento de pagos manuales

### 👨‍💼 **Administradores de Restaurante**

#### 1. La Parrilla Criolla (USD)
```
📧 Email: admin@laparrillacriolla.com
🔐 Password: demo123456
🏪 Restaurante: La Parrilla Criolla
💰 Moneda: USD (Dólar Estadounidense)
📦 Plan: Plan Básico ($29.99)
🌐 Menu Público: http://localhost:5173/menu/la-parrilla-criolla
```

#### 2. Don Ceviche (NIO)
```
📧 Email: admin@donceviche.com
🔐 Password: demo123456
🏪 Restaurante: Don Ceviche
💰 Moneda: NIO (Córdoba Nicaragüense)
📦 Plan: Plan Premium ($59.99)
🌐 Menu Público: http://localhost:5173/menu/don-ceviche
```

#### 3. Bella Vista (CRC)
```
📧 Email: admin@bellavista.com
🔐 Password: demo123456
🏪 Restaurante: Bella Vista
💰 Moneda: CRC (Colón Costarricense)
📦 Plan: Plan Gratuito ($0)
🌐 Menu Público: http://localhost:5173/menu/bella-vista
```

---

## 📊 Estadísticas Creadas

| Elemento | Cantidad | Descripción |
|----------|----------|-------------|
| 📋 Planes | 3 | Gratuito, Básico, Premium |
| 🏪 Restaurantes | 3 | Con diferentes monedas y planes |
| 💳 Suscripciones | 3 | Todas activas con fechas válidas |
| 👨‍💼 Admins | 3 | Uno por restaurante |
| 👑 Super Admins | 1 | Administrador del sistema |
| 🍽️ Productos | 10 | Solo en La Parrilla Criolla |
| 🪑 Mesas | 12 | Solo en La Parrilla Criolla |
| 📂 Categorías | 5 | Solo en La Parrilla Criolla |

---

## 🌍 Sistema Multi-Moneda Demo

El seed crea restaurantes con diferentes monedas para demostrar el sistema multi-moneda:

| Restaurante | Moneda | Símbolo | País | Decimales |
|-------------|--------|---------|------|-----------|
| La Parrilla Criolla | USD | $ | Estados Unidos | 2 |
| Don Ceviche | NIO | C$ | Nicaragua | 2 |
| Bella Vista | CRC | ₡ | Costa Rica | 0 |

---

## 🔗 URLs Principales del Sistema

### Interfaces de Usuario
- **🏠 Landing Page**: http://localhost:5173/
- **👨‍💼 Admin Login**: http://localhost:5173/admin/login
- **👑 Super Admin Login**: http://localhost:5173/super-admin/login
- **👑 Super Admin Dashboard**: http://localhost:5173/super-admin/dashboard

### Menús Públicos Demo
- **La Parrilla Criolla**: http://localhost:5173/menu/la-parrilla-criolla?mesa=1
- **Don Ceviche**: http://localhost:5173/menu/don-ceviche?mesa=1  
- **Bella Vista**: http://localhost:5173/menu/bella-vista?mesa=1

### APIs Backend
- **🏥 Health Check**: http://localhost:3001/health
- **📱 API Docs**: http://localhost:3001/api

---

## 🔄 Cómo Reiniciar la Base de Datos

Si necesitas limpiar y volver a crear todos los datos:

```bash
cd packages/backend

# Opción 1: Reset completo (recomendado)
npx prisma migrate reset

# Opción 2: Reset y seed manual
npx prisma migrate reset --skip-seed
node seed-unified.js
```

---

## 📋 Casos de Uso de Testing

### Para Desarrolladores
1. **Login como Super Admin** → Gestionar suscripciones
2. **Login como Admin** → Configurar restaurante y menú
3. **Acceso público** → Ver menú desde QR
4. **Pruebas de moneda** → Verificar formateo correcto
5. **Gestión de planes** → Crear/editar/eliminar planes

### Para Demos y Presentaciones
- Tres restaurantes listos con diferentes características
- Menú completo en La Parrilla Criolla
- Sistema de multi-moneda funcionando
- Dashboard de super admin con datos reales

---

## ⚠️ Notas Importantes

### Seguridad
- Las contraseñas están hasheadas con bcrypt (12 rounds)
- Los tokens JWT son seguros y tienen expiración
- Todas las validaciones están implementadas

### Datos Demo
- Los productos solo se crean en "La Parrilla Criolla"
- Las mesas solo existen en "La Parrilla Criolla"
- Los otros restaurantes están listos para configurar

### Multi-Moneda
- Cada restaurante usa una moneda diferente
- El formateo es automático según la moneda
- No hay conversión de moneda (solo formateo)

---

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
```bash
# Verificar que PostgreSQL esté corriendo
docker compose up -d
```

### Error: "Prisma schema not found"
```bash
# Ejecutar desde el directorio correcto
cd packages/backend
```

### Error: "Table does not exist"
```bash
# Ejecutar migraciones primero
npx prisma migrate dev
```

### Datos duplicados
El seed usa `upsert()` para evitar duplicados, es seguro ejecutarlo múltiples veces.

---

## 📞 Soporte y Contacto

Para problemas con el seed:
1. Verificar que la base de datos esté corriendo
2. Ejecutar `npx prisma migrate dev` primero
3. Revisar los logs del seed para errores específicos
4. En caso de emergencia: `npx prisma migrate reset`

**Tiempo estimado de ejecución**: 5-10 segundos
**Última actualización**: Diciembre 2024
**Versión del seed**: 1.0.0 (Unificado) 