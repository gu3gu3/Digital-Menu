# 🚀 Guía de Despliegue en Google Cloud Platform

Esta guía te llevará paso a paso para desplegar la aplicación Digital Menu QR en Google Cloud Platform con el menor overhead de infraestructura.

## 📋 Prerrequisitos

- Cuenta de Google Cloud Platform
- Google Cloud CLI instalado
- Docker instalado localmente
- Proyecto funcionando localmente

## 🛠️ Configuración Inicial

### 1. Configurar Google Cloud CLI

```bash
# Instalar Google Cloud CLI (si no está instalado)
# En Ubuntu/Debian:
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# En macOS:
brew install --cask google-cloud-sdk

# En Windows:
# Descargar desde https://cloud.google.com/sdk/docs/install

# Autenticarse
gcloud auth login

# Configurar proyecto (reemplaza YOUR_PROJECT_ID)
gcloud config set project YOUR_PROJECT_ID

# Verificar configuración
gcloud config list
```

### 2. Habilitar APIs Necesarias

```bash
# Habilitar las APIs requeridas
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

## 🗄️ Configuración de Base de Datos

### 1. Crear Instancia de Cloud SQL

```bash
# Crear instancia PostgreSQL (tier básico para empezar)
gcloud sql instances create digital-menu-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --deletion-protection

# Crear base de datos
gcloud sql databases create digital_menu_prod \
  --instance=digital-menu-db

# Crear usuario de aplicación
gcloud sql users create digital_menu_user \
  --instance=digital-menu-db \
  --password=YOUR_SECURE_PASSWORD_HERE

# Obtener la connection string
gcloud sql instances describe digital-menu-db --format="value(connectionName)"
# Resultado será algo como: your-project:us-central1:digital-menu-db
```

### 2. Configurar Conexión Segura

```bash
# Crear usuario de servicio para Cloud SQL
gcloud iam service-accounts create digital-menu-sql \
  --display-name="Digital Menu SQL Service Account"

# Asignar permisos
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:digital-menu-sql@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

## 🔐 Gestión de Secretos

### 1. Crear Secretos en Secret Manager

```bash
# JWT Secret (generar uno seguro)
echo -n "$(openssl rand -base64 32)" | gcloud secrets create jwt-secret --data-file=-

# Database URL
echo -n "postgresql://digital_menu_user:YOUR_SECURE_PASSWORD_HERE@/digital_menu_prod?host=/cloudsql/YOUR_PROJECT:us-central1:digital-menu-db" | gcloud secrets create database-url --data-file=-

# Superuser credentials
echo -n "admin@yourdomain.com" | gcloud secrets create super-user-email --data-file=-
echo -n "$(openssl rand -base64 16)" | gcloud secrets create super-user-password --data-file=-
```

### 2. Configurar Permisos para Cloud Run

```bash
# Crear service account para Cloud Run
gcloud iam service-accounts create digital-menu-run \
  --display-name="Digital Menu Cloud Run Service Account"

# Asignar permisos para acceder a secretos
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:digital-menu-run@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Asignar permisos para Cloud SQL
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:digital-menu-run@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

## 🐳 Despliegue de la Aplicación

### 1. Preparar el Backend para Producción

Crear archivo `packages/backend/.env.production`:

```env
NODE_ENV=production
PORT=3001
```

### 2. Desplegar en Cloud Run

```bash
# Navegar al directorio del backend
cd packages/backend

# Desplegar usando Cloud Build
gcloud run deploy digital-menu-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --service-account digital-menu-run@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --add-cloudsql-instances YOUR_PROJECT:us-central1:digital-menu-db \
  --set-env-vars NODE_ENV=production,PORT=3001 \
  --set-secrets DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,SUPER_USER_EMAIL=super-user-email:latest,SUPER_USER_PASSWORD=super-user-password:latest \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300s
```

### 3. Ejecutar Migraciones

```bash
# Obtener la URL del servicio desplegado
SERVICE_URL=$(gcloud run services describe digital-menu-api --region=us-central1 --format="value(status.url)")

# Crear un job temporal para ejecutar migraciones
gcloud run jobs create digital-menu-migrate \
  --image gcr.io/YOUR_PROJECT_ID/digital-menu-api \
  --region us-central1 \
  --service-account digital-menu-run@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --add-cloudsql-instances YOUR_PROJECT:us-central1:digital-menu-db \
  --set-secrets DATABASE_URL=database-url:latest \
  --command npx \
  --args prisma,migrate,deploy

# Ejecutar migraciones
gcloud run jobs execute digital-menu-migrate --region=us-central1 --wait

# Crear job para seed (opcional, solo primera vez)
gcloud run jobs create digital-menu-seed \
  --image gcr.io/YOUR_PROJECT_ID/digital-menu-api \
  --region us-central1 \
  --service-account digital-menu-run@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --add-cloudsql-instances YOUR_PROJECT:us-central1:digital-menu-db \
  --set-secrets DATABASE_URL=database-url:latest,SUPER_USER_EMAIL=super-user-email:latest,SUPER_USER_PASSWORD=super-user-password:latest \
  --command node \
  --args prisma/seed.js

# Ejecutar seed
gcloud run jobs execute digital-menu-seed --region=us-central1 --wait
```

## 🌐 Configuración de Dominio (Opcional)

### 1. Configurar Dominio Personalizado

```bash
# Mapear dominio personalizado
gcloud run domain-mappings create \
  --service digital-menu-api \
  --domain api.yourdomain.com \
  --region us-central1

# Verificar el mapeo
gcloud run domain-mappings list --region=us-central1
```

### 2. Configurar HTTPS

Cloud Run automáticamente proporciona certificados SSL para dominios personalizados.

## 📊 Monitoreo y Logs

### 1. Configurar Alertas

```bash
# Crear política de alerta para errores
gcloud alpha monitoring policies create --policy-from-file=monitoring-policy.yaml
```

### 2. Ver Logs

```bash
# Ver logs en tiempo real
gcloud run services logs tail digital-menu-api --region=us-central1

# Ver logs específicos
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=digital-menu-api" --limit=50
```

## 💰 Optimización de Costos

### 1. Configuración de Escalado

```bash
# Actualizar configuración para optimizar costos
gcloud run services update digital-menu-api \
  --region us-central1 \
  --min-instances 0 \
  --max-instances 5 \
  --concurrency 80 \
  --cpu-throttling \
  --memory 256Mi
```

### 2. Configurar Cloud SQL para Desarrollo

Para entornos de desarrollo, puedes usar una instancia más pequeña:

```bash
# Crear instancia de desarrollo
gcloud sql instances create digital-menu-db-dev \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB
```

## 🔄 CI/CD con GitHub Actions (Opcional)

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - id: 'auth'
      uses: 'google-github-actions/auth@v1'
      with:
        credentials_json: '${{ secrets.GCP_SA_KEY }}'
    
    - name: 'Set up Cloud SDK'
      uses: 'google-github-actions/setup-gcloud@v1'
    
    - name: 'Deploy to Cloud Run'
      run: |
        cd packages/backend
        gcloud run deploy digital-menu-api \
          --source . \
          --platform managed \
          --region us-central1 \
          --allow-unauthenticated
```

## 🧪 Testing en Producción

```bash
# Obtener URL del servicio
SERVICE_URL=$(gcloud run services describe digital-menu-api --region=us-central1 --format="value(status.url)")

# Test health check
curl $SERVICE_URL/health

# Test login
curl -X POST $SERVICE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@yourdomain.com", "password": "your-password", "role": "ADMINISTRADOR"}'
```

## 📋 Checklist de Despliegue

- [ ] Proyecto GCP configurado
- [ ] APIs habilitadas
- [ ] Cloud SQL instancia creada
- [ ] Base de datos y usuario creados
- [ ] Secretos configurados en Secret Manager
- [ ] Service accounts creados con permisos
- [ ] Aplicación desplegada en Cloud Run
- [ ] Migraciones ejecutadas
- [ ] Seed ejecutado (primera vez)
- [ ] Health check funcionando
- [ ] Login funcionando
- [ ] Dominio configurado (opcional)
- [ ] Monitoreo configurado

## 💡 Consejos de Producción

1. **Seguridad**: Nunca hardcodees credenciales, usa Secret Manager
2. **Backup**: Configura backups automáticos de Cloud SQL
3. **Monitoreo**: Configura alertas para errores y latencia
4. **Escalado**: Ajusta min/max instances según tu tráfico
5. **Costos**: Revisa regularmente el uso y optimiza recursos

## 🆘 Troubleshooting

### Error de Conexión a Base de Datos
```bash
# Verificar que Cloud SQL esté corriendo
gcloud sql instances list

# Verificar conexión
gcloud sql connect digital-menu-db --user=digital_menu_user
```

### Error de Permisos
```bash
# Verificar service account
gcloud iam service-accounts list

# Verificar permisos
gcloud projects get-iam-policy YOUR_PROJECT_ID
```

### Error de Despliegue
```bash
# Ver logs de build
gcloud builds list --limit=5

# Ver detalles de un build específico
gcloud builds describe BUILD_ID
```

---

¡Con esta configuración tendrás tu aplicación Digital Menu QR funcionando en Google Cloud Platform con alta disponibilidad y escalabilidad automática! 