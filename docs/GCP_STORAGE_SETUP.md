# 🪣 Google Cloud Storage Setup para Digital Menu QR

Esta guía detalla la configuración de Google Cloud Storage para el manejo de imágenes en producción, incluyendo la creación de service accounts y la estructura de carpetas organizadas por restaurante.

## 🏗️ Arquitectura de Almacenamiento

### Estructura de Carpetas en GCP Storage
```
gs://digital-menu-images/
├── restaurants/
│   ├── mi-viejo-ranchito/
│   │   ├── logo-1701234567890.png
│   │   ├── banner-1701234567891.jpg
│   │   └── menu-background-1701234567892.webp
│   ├── pizzeria-don-pepe/
│   │   ├── logo-1701234567893.png
│   │   └── banner-1701234567894.jpg
│   └── restaurante-la-cocina/
│       ├── logo-1701234567895.png
│       └── banner-1701234567896.jpg
└── products/
    ├── mi-viejo-ranchito/
    │   ├── ceviche-1701234567897.jpg
    │   ├── gallo-pinto-1701234567898.png
    │   └── pollo-asado-1701234567899.webp
    ├── pizzeria-don-pepe/
    │   ├── pizza-margarita-1701234567900.jpg
    │   ├── pizza-pepperoni-1701234567901.jpg
    │   └── calzone-1701234567902.png
    └── restaurante-la-cocina/
        ├── sopa-mondongo-1701234567903.jpg
        └── arroz-con-pollo-1701234567904.png
```

### Beneficios de esta Estructura
- **Separación clara**: Imágenes de restaurantes vs productos
- **Organización por restaurante**: Fácil gestión y migración de datos
- **Escalabilidad**: Soporte para múltiples restaurantes
- **Backup granular**: Respaldo por restaurante individual
- **Permisos específicos**: Control de acceso por carpeta

## 🔧 Configuración Paso a Paso

### 1. Crear Proyecto en Google Cloud Platform

```bash
# Instalar Google Cloud CLI si no está instalado
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Crear nuevo proyecto
gcloud projects create digital-menu-qr-prod --name="Digital Menu QR Production"
gcloud config set project digital-menu-qr-prod

# Habilitar APIs necesarias
gcloud services enable storage.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
```

### 2. Crear Storage Bucket

```bash
# Crear bucket con configuración optimizada
gsutil mb -c STANDARD -l us-central1 gs://digital-menu-images

# Configurar CORS para permitir acceso desde frontend
cat > cors.json << EOF
[
  {
    "origin": ["https://your-frontend-domain.com", "http://localhost:5173"],
    "method": ["GET", "HEAD", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://digital-menu-images

# Configurar política de acceso público para lectura
gsutil iam ch allUsers:objectViewer gs://digital-menu-images
```

### 3. Crear Service Account

```bash
# Crear service account específico para el storage
gcloud iam service-accounts create digital-menu-storage \
    --display-name="Digital Menu Storage Service Account" \
    --description="Service account para gestión de imágenes del sistema de menú digital"

# Asignar permisos específicos al storage bucket
gcloud projects add-iam-policy-binding digital-menu-qr-prod \
    --member="serviceAccount:digital-menu-storage@digital-menu-qr-prod.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

# Crear y descargar las credenciales
gcloud iam service-accounts keys create ./service-account-key.json \
    --iam-account=digital-menu-storage@digital-menu-qr-prod.iam.gserviceaccount.com
```

### 4. Configurar Política de Bucket Específica

```bash
# Crear política de bucket para acceso granular
cat > bucket-policy.json << EOF
{
  "bindings": [
    {
      "role": "roles/storage.objectViewer",
      "members": ["allUsers"]
    },
    {
      "role": "roles/storage.objectAdmin",
      "members": ["serviceAccount:digital-menu-storage@digital-menu-qr-prod.iam.gserviceaccount.com"]
    }
  ]
}
EOF

gsutil iam set bucket-policy.json gs://digital-menu-images
```

## 🔒 Seguridad y Mejores Prácticas

### Service Account Security
- **Principio de menor privilegio**: Solo permisos Storage Object Admin
- **Rotación de keys**: Renovar credenciales cada 90 días
- **Monitoreo**: Habilitar Cloud Audit Logs para el bucket

### Bucket Security
```bash
# Habilitar versionado para protección contra borrado accidental
gsutil versioning set on gs://digital-menu-images

# Configurar lifecycle management
cat > lifecycle.json << EOF
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {
        "age": 365,
        "isLive": false
      }
    }
  ]
}
EOF

gsutil lifecycle set lifecycle.json gs://digital-menu-images

# Habilitar logging de acceso
gsutil logging set on -b gs://digital-menu-access-logs gs://digital-menu-images
```

## 🛠️ Configuración en la Aplicación

### Variables de Entorno para Producción

```env
# Google Cloud Storage Configuration
NODE_ENV=production
GCP_PROJECT_ID=digital-menu-qr-prod
GCP_STORAGE_BUCKET=digital-menu-images
GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/service-account-key.json

# Database
DATABASE_URL="postgresql://user:password@/database?host=/cloudsql/project:region:instance"

# JWT
JWT_SECRET="your-super-secure-jwt-secret-with-at-least-256-bits"
JWT_EXPIRES_IN="7d"

# CORS
FRONTEND_URL="https://your-frontend-domain.com"
```

### Dockerfile Actualizado para Producción

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Crear directorio para credenciales
RUN mkdir -p /app/credentials

# Generar cliente Prisma
RUN npx prisma generate

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Cambiar ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001

CMD ["node", "src/index.js"]
```

### Cloud Run Deployment

```bash
# Build y deploy con secrets
gcloud run deploy digital-menu-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,GCP_PROJECT_ID=digital-menu-qr-prod,GCP_STORAGE_BUCKET=digital-menu-images \
  --set-secrets GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/service-account-key.json:digital-menu-storage-key:latest \
  --set-cloudsql-instances digital-menu-qr-prod:us-central1:digital-menu-db
```

## 📋 Migración de Desarrollo a Producción

### Script de Migración de Imágenes

```javascript
// migrate-images.js
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

const storage = new Storage({
  projectId: 'digital-menu-qr-prod',
  keyFilename: './service-account-key.json'
});

const bucket = storage.bucket('digital-menu-images');

async function migrateImages() {
  const uploadsDir = './uploads';
  
  // Migrar imágenes de restaurantes
  const restaurantsDir = path.join(uploadsDir, 'restaurants');
  if (fs.existsSync(restaurantsDir)) {
    const files = fs.readdirSync(restaurantsDir);
    for (const file of files) {
      const localPath = path.join(restaurantsDir, file);
      const cloudPath = `restaurants/migration/${file}`;
      
      console.log(`Subiendo ${file} a ${cloudPath}`);
      await bucket.upload(localPath, {
        destination: cloudPath,
        metadata: {
          metadata: {
            originalPath: localPath,
            migratedAt: new Date().toISOString()
          }
        }
      });
    }
  }
  
  // Migrar imágenes de productos
  const productsDir = path.join(uploadsDir, 'products');
  if (fs.existsSync(productsDir)) {
    const files = fs.readdirSync(productsDir);
    for (const file of files) {
      const localPath = path.join(productsDir, file);
      const cloudPath = `products/migration/${file}`;
      
      console.log(`Subiendo ${file} a ${cloudPath}`);
      await bucket.upload(localPath, {
        destination: cloudPath,
        metadata: {
          metadata: {
            originalPath: localPath,
            migratedAt: new Date().toISOString()
          }
        }
      });
    }
  }
  
  console.log('✅ Migración completada');
}

migrateImages().catch(console.error);
```

### Actualización de URLs en Base de Datos

```sql
-- Script SQL para actualizar URLs después de migración
UPDATE restaurantes 
SET logoUrl = REPLACE(logoUrl, '/uploads/restaurants/', 'https://storage.googleapis.com/digital-menu-images/restaurants/migration/')
WHERE logoUrl LIKE '/uploads/restaurants/%';

UPDATE restaurantes 
SET bannerUrl = REPLACE(bannerUrl, '/uploads/restaurants/', 'https://storage.googleapis.com/digital-menu-images/restaurants/migration/')
WHERE bannerUrl LIKE '/uploads/restaurants/%';

UPDATE productos 
SET imagenUrl = REPLACE(imagenUrl, '/uploads/products/', 'https://storage.googleapis.com/digital-menu-images/products/migration/')
WHERE imagenUrl LIKE '/uploads/products/%';
```

## 🔍 Monitoreo y Mantenimiento

### Métricas Importantes
- **Storage usage**: Monitorear uso de almacenamiento
- **Request count**: Número de requests al bucket
- **Data transfer**: Transferencia de datos
- **Error rate**: Tasa de errores en uploads

### Comandos Útiles

```bash
# Ver uso del bucket
gsutil du -sh gs://digital-menu-images

# Listar archivos por restaurante
gsutil ls gs://digital-menu-images/restaurants/mi-viejo-ranchito/

# Backup de un restaurante específico
gsutil -m cp -r gs://digital-menu-images/restaurants/mi-viejo-ranchito/ ./backup/

# Limpiar archivos temporales
gsutil -m rm gs://digital-menu-images/temp/**

# Ver logs de acceso
gcloud logging read "resource.type=gcs_bucket AND resource.labels.bucket_name=digital-menu-images"
```

## 🚨 Troubleshooting

### Error: Credentials no encontradas
```bash
# Verificar que las credenciales estén configuradas
gcloud auth application-default print-access-token

# Re-generar credenciales si es necesario
gcloud iam service-accounts keys create ./new-service-account-key.json \
  --iam-account=digital-menu-storage@digital-menu-qr-prod.iam.gserviceaccount.com
```

### Error: Bucket no accesible
```bash
# Verificar permisos del bucket
gsutil iam get gs://digital-menu-images

# Verificar CORS configuration
gsutil cors get gs://digital-menu-images
```

### Error: Upload fallido
```bash
# Verificar logs de Cloud Run
gcloud run services logs read digital-menu-api --region=us-central1

# Verificar permisos del service account
gcloud projects get-iam-policy digital-menu-qr-prod \
  --flatten="bindings[].members" \
  --filter="bindings.members:digital-menu-storage@digital-menu-qr-prod.iam.gserviceaccount.com"
```

## 📊 Costos Estimados

### Storage Costs (us-central1)
- **Standard Storage**: $0.020 per GB/month
- **Class A operations** (uploads): $0.05 per 10,000 operations
- **Class B operations** (downloads): $0.004 per 10,000 operations
- **Network egress**: $0.12 per GB (after 1GB free tier)

### Ejemplo de Costo Mensual
Para un restaurante con:
- 100 imágenes de productos (10MB cada una) = 1GB
- 1000 visualizaciones de menú por mes
- Costo estimado: ~$0.50/mes por restaurante

---

**💡 Consejo**: Implementar esta configuración gradualmente, comenzando con un restaurante piloto antes del rollout completo. 