# 🚀 Flujo de Desarrollo a Producción - MenuView.app

## 🎯 Objetivo

Este documento describe el flujo completo para desarrollar, probar y desplegar cambios en **menuview.app** de manera rápida y segura.

## 🏗️ Arquitectura de Deployment

```
DESARROLLO LOCAL          GCP STAGING           GCP PRODUCTION
├── localhost:5173        ├── staging.          ├── menuview.app
├── localhost:3001        │   menuview.app      ├── api.menuview.app
└── PostgreSQL local      ├── api-staging.      └── www.menuview.app
                          │   menuview.app      
                          └── Cloud SQL         └── Cloud SQL
```

## 🔄 Workflow de Desarrollo

### **1. Configuración Inicial (Una sola vez)**

#### **🛠️ Setup Local**
```bash
# Clonar repositorio
git clone <repository-url>
cd Digital-Menu

# Instalar dependencias
npm install

# Configurar variables de entorno
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env

# Configurar base de datos local
npm run db:migrate
npm run db:seed
```

#### **☁️ Setup GCP Production**
```bash
# Ejecutar script de configuración
chmod +x scripts/setup-gcp-menuview.sh
./scripts/setup-gcp-menuview.sh
```

#### **🔐 Setup GitHub Secrets**
En GitHub repository → Settings → Secrets and variables → Actions:

```bash
# Service Account Key para CI/CD
GCP_SERVICE_ACCOUNT_KEY = [contenido del archivo service-account-key.json]
```

### **2. Flujo de Desarrollo Diario**

#### **📝 Paso 1: Crear rama de feature**
```bash
git checkout main
git pull origin main
git checkout -b feature/nueva-funcionalidad
```

#### **🔧 Paso 2: Desarrollo local**
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend  
npm run dev:frontend

# Terminal 3: Database (opcional)
npm run db:studio
```

**URLs de desarrollo:**
- Frontend: http://localhost:5173
- API: http://localhost:3001/api
- Database Studio: http://localhost:5555

#### **🧪 Paso 3: Testing local**
```bash
# Ejecutar tests
npm run test --workspace=backend

# Verificar build
npm run build

# Test manual en browser
# - Funcionalidad nueva
# - Regresión de features existentes
```

#### **📤 Paso 4: Commit y push**
```bash
git add .
git commit -m "feat: agregar nueva funcionalidad X"
git push origin feature/nueva-funcionalidad
```

#### **🔀 Paso 5: Pull Request**
1. Crear Pull Request en GitHub
2. Describir cambios y testing realizado
3. Asignar reviewer (opcional)
4. Verificar que pase CI/CD checks

#### **🚀 Paso 6: Deploy a producción**
```bash
# Merge a main (activa deployment automático)
git checkout main
git merge feature/nueva-funcionalidad
git push origin main

# GitHub Actions automáticamente:
# 1. Ejecuta tests
# 2. Builda la aplicación  
# 3. Despliega backend a Cloud Run
# 4. Ejecuta migraciones de DB
# 5. Despliega frontend a Cloud Run
# 6. Configura dominios
# 7. Ejecuta health checks
```

## ⚡ Deployment Rápido (Hot Fixes)

Para cambios urgentes en producción:

```bash
# Crear hotfix
git checkout main
git checkout -b hotfix/fix-critico

# Hacer cambios mínimos
# ... editar archivos ...

# Test rápido local
npm run dev

# Deploy inmediato
git add .
git commit -m "hotfix: corrección crítica"
git push origin hotfix/fix-critico

# Merge directo a main
git checkout main
git merge hotfix/fix-critico
git push origin main
```

⏱️ **Tiempo total del hotfix: ~5-10 minutos**

## 🔍 Monitoreo y Debugging

### **📊 Logs en tiempo real**
```bash
# Logs del backend
gcloud run services logs tail menuview-api --region=us-central1

# Logs del frontend
gcloud run services logs tail menuview-frontend --region=us-central1

# Logs específicos con filtro
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit=50
```

### **🏥 Health Checks**
```bash
# Verificar estado de servicios
curl https://api.menuview.app/health
curl https://menuview.app

# Verificar base de datos
gcloud sql instances describe menuview-db
```

### **📈 Métricas**
- **Cloud Console**: https://console.cloud.google.com/run
- **Uptime Monitoring**: Configurar alertas para downtime
- **Error Reporting**: Monitoreo automático de errores

## 🗂️ Estructura de Branches

```
main                    # Producción (menuview.app)
├── develop            # Staging (staging.menuview.app)
├── feature/X          # Nuevas funcionalidades
├── hotfix/X           # Correcciones urgentes
└── release/v1.X       # Preparación de releases
```

## 📋 Checklist Pre-Deploy

### **✅ Desarrollo Local**
- [ ] Feature funciona correctamente
- [ ] Tests pasan localmente
- [ ] Build exitoso sin errores
- [ ] No hay console.log() en código
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada correctamente

### **✅ Pre-Producción**
- [ ] Pull Request creado y revisado
- [ ] CI/CD checks pasan
- [ ] No hay dependencias faltantes
- [ ] Configuración de Storage correcta
- [ ] Secrets actualizados si es necesario

### **✅ Post-Deploy**
- [ ] Health checks exitosos
- [ ] Frontend carga correctamente
- [ ] API responde correctamente
- [ ] Base de datos conectada
- [ ] Storage funcionando (uploads)
- [ ] Autenticación funcional

## 🚨 Rollback Plan

Si algo falla en producción:

### **🔄 Rollback Automático**
```bash
# Rollback a versión anterior
gcloud run services update-traffic menuview-api --to-revisions=REVISION_NAME=100 --region=us-central1
gcloud run services update-traffic menuview-frontend --to-revisions=REVISION_NAME=100 --region=us-central1
```

### **🔧 Rollback Manual**
```bash
# Ver revisiones disponibles
gcloud run revisions list --service=menuview-api --region=us-central1

# Rollback específico
gcloud run services update-traffic menuview-api --to-revisions=menuview-api-00001=100 --region=us-central1
```

### **🗄️ Rollback de Base de Datos**
```bash
# Restaurar desde backup automático
gcloud sql backups restore BACKUP_ID --restore-instance=menuview-db
```

## 🔐 Secrets Management

### **Actualizar Secrets**
```bash
# Rotar JWT secret
NEW_SECRET=$(openssl rand -base64 32)
echo -n "$NEW_SECRET" | gcloud secrets versions add jwt-secret --data-file=-

# Actualizar password de DB
gcloud sql users set-password menuview_user --instance=menuview-db --password=NEW_PASSWORD
```

### **Environment Variables**
```bash
# Development (.env)
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/digital_menu

# Production (GCP Secrets)
NODE_ENV=production
DATABASE_URL=[SECRET_MANAGER]
JWT_SECRET=[SECRET_MANAGER]
```

## 📊 Performance Optimization

### **🚀 Backend Optimization**
- **Memory**: 512Mi - 1Gi según carga
- **CPU**: 1-2 vCPUs para alto tráfico
- **Instances**: Min 1, Max 10
- **Timeout**: 300s para uploads grandes

### **🎨 Frontend Optimization**
- **Memory**: 256Mi suficiente
- **CPU**: 1 vCPU
- **Instances**: Min 0, Max 5
- **CDN**: Cloud CDN para assets estáticos

### **🗄️ Database Optimization**
- **Tier**: db-f1-micro para desarrollo
- **Tier**: db-n1-standard-1 para producción
- **Backup**: Automático cada 6 horas
- **Maintenance**: Domingos 3:00 AM

## 💰 Cost Management

### **📊 Monitoring de Costos**
```bash
# Ver costos actuales
gcloud billing budgets list

# Configurar alerta de presupuesto
gcloud billing budgets create --billing-account=BILLING_ACCOUNT --display-name="MenuView Monthly Budget" --budget-amount=50
```

### **🔧 Optimización**
- **Cloud Run**: Pay per request
- **Cloud SQL**: Apagar cuando no se use
- **Storage**: Usar lifecycle policies
- **Networking**: Optimizar región único

## 🎯 Métricas de Éxito

### **⏱️ Performance**
- **Time to Deploy**: < 10 minutos
- **Uptime**: > 99.9%
- **Response Time**: < 2 segundos
- **Build Time**: < 5 minutos

### **👥 Developer Experience**
- **Local Setup**: < 15 minutos
- **Hot Reload**: < 3 segundos
- **Test Execution**: < 2 minutos
- **Feature to Production**: < 1 hora

---

## 🚀 Quick Commands Reference

```bash
# Development
npm run dev                    # Start full stack
npm run dev:backend           # Backend only
npm run dev:frontend          # Frontend only

# Database
npm run db:migrate            # Run migrations
npm run db:seed              # Seed with demo data
npm run db:studio            # Open Prisma Studio

# Build & Deploy
npm run build                # Build both apps
git push origin main         # Deploy to production

# GCP Management
gcloud run services list     # List services
gcloud sql instances list   # List databases
gcloud secrets list         # List secrets

# Monitoring
gcloud run services logs tail menuview-api
curl https://api.menuview.app/health
```

¡Con este workflow puedes hacer cambios en desarrollo y verlos en producción en **menos de 10 minutos**! 🚀 