#!/bin/bash

# 🚀 Setup script for menuview.app on Google Cloud Platform
# Este script configura todo lo necesario para deployer en GCP

set -e

echo "🌐 Setting up menuview.app on Google Cloud Platform"
echo "=================================================="

# Variables de configuración
PROJECT_ID="menuview-app-prod"
REGION="us-central1"
BUCKET_NAME="menuview-images"
DB_INSTANCE="menuview-db"
SERVICE_ACCOUNT_NAME="menuview-run"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Verificar que gcloud esté instalado
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud CLI no está instalado. Instálalo desde: https://cloud.google.com/sdk"
    exit 1
fi

# Verificar autenticación
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_warning "No estás autenticado en Google Cloud"
    echo "Ejecutando: gcloud auth login"
    gcloud auth login
fi

# Configurar proyecto
print_info "Configurando proyecto: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Verificar si el proyecto existe
if ! gcloud projects describe $PROJECT_ID &> /dev/null; then
    print_warning "El proyecto $PROJECT_ID no existe."
    read -p "¿Quieres crearlo? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gcloud projects create $PROJECT_ID --name="MenuView App Production"
        print_status "Proyecto $PROJECT_ID creado"
    else
        print_error "Proyecto requerido para continuar"
        exit 1
    fi
fi

# Habilitar APIs necesarias
print_info "Habilitando APIs necesarias..."
gcloud services enable \
    run.googleapis.com \
    sql-component.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    sqladmin.googleapis.com \
    storage.googleapis.com \
    iam.googleapis.com

print_status "APIs habilitadas"

# Crear Cloud SQL instance
print_info "Creando instancia de Cloud SQL..."
if ! gcloud sql instances describe $DB_INSTANCE &> /dev/null; then
    gcloud sql instances create $DB_INSTANCE \
        --database-version=POSTGRES_14 \
        --tier=db-f1-micro \
        --region=$REGION \
        --storage-type=SSD \
        --storage-size=10GB \
        --backup-start-time=03:00 \
        --enable-bin-log \
        --deletion-protection
    print_status "Instancia Cloud SQL creada"
else
    print_warning "Instancia Cloud SQL ya existe"
fi

# Crear base de datos
print_info "Creando base de datos..."
if ! gcloud sql databases describe menuview_prod --instance=$DB_INSTANCE &> /dev/null; then
    gcloud sql databases create menuview_prod --instance=$DB_INSTANCE
    print_status "Base de datos creada"
else
    print_warning "Base de datos ya existe"
fi

# Crear usuario de base de datos
print_info "Creando usuario de base de datos..."
DB_PASSWORD=$(openssl rand -base64 32)
if ! gcloud sql users describe menuview_user --instance=$DB_INSTANCE &> /dev/null; then
    gcloud sql users create menuview_user \
        --instance=$DB_INSTANCE \
        --password=$DB_PASSWORD
    print_status "Usuario de base de datos creado"
    print_info "Contraseña generada (guárdala): $DB_PASSWORD"
else
    print_warning "Usuario de base de datos ya existe"
    read -p "Ingresa la contraseña del usuario menuview_user: " -s DB_PASSWORD
    echo
fi

# Crear Storage Bucket
print_info "Creando bucket de almacenamiento..."
if ! gsutil ls gs://$BUCKET_NAME &> /dev/null; then
    gsutil mb -c STANDARD -l $REGION gs://$BUCKET_NAME
    print_status "Bucket creado"
    
    # Configurar CORS
    cat > /tmp/cors.json << EOF
[
  {
    "origin": [
      "https://menuview.app",
      "https://www.menuview.app", 
      "https://api.menuview.app",
      "http://localhost:5173"
    ],
    "method": ["GET", "HEAD", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
EOF
    
    gsutil cors set /tmp/cors.json gs://$BUCKET_NAME
    gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
    print_status "CORS configurado para el bucket"
else
    print_warning "Bucket ya existe"
fi

# Crear Service Account
print_info "Creando service account..."
if ! gcloud iam service-accounts describe $SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com &> /dev/null; then
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="MenuView App Service Account"
    print_status "Service account creado"
else
    print_warning "Service account ya existe"
fi

# Asignar permisos
print_info "Asignando permisos..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

print_status "Permisos asignados"

# Crear secretos
print_info "Creando secretos en Secret Manager..."

# JWT Secret
JWT_SECRET=$(openssl rand -base64 32)
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=- || print_warning "jwt-secret ya existe"

# Super Admin JWT Secret
SUPER_JWT_SECRET=$(openssl rand -base64 32)
echo -n "$SUPER_JWT_SECRET" | gcloud secrets create super-admin-jwt-secret --data-file=- || print_warning "super-admin-jwt-secret ya existe"

# Database URL
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE --format="value(connectionName)")
DATABASE_URL="postgresql://menuview_user:$DB_PASSWORD@/$DB_INSTANCE?host=/cloudsql/$CONNECTION_NAME"
echo -n "$DATABASE_URL" | gcloud secrets create database-url --data-file=- || print_warning "database-url ya existe"

# Super User credentials
echo -n "admin@menuview.app" | gcloud secrets create super-user-email --data-file=- || print_warning "super-user-email ya existe"
SUPER_USER_PASSWORD=$(openssl rand -base64 16)
echo -n "$SUPER_USER_PASSWORD" | gcloud secrets create super-user-password --data-file=- || print_warning "super-user-password ya existe"

# GCP Project ID y Bucket
echo -n "$PROJECT_ID" | gcloud secrets create gcp-project-id --data-file=- || print_warning "gcp-project-id ya existe"
echo -n "$BUCKET_NAME" | gcloud secrets create gcp-storage-bucket --data-file=- || print_warning "gcp-storage-bucket ya existe"

print_status "Secretos creados en Secret Manager"

# Generar variables de entorno para desarrollo local
print_info "Generando archivo .env para desarrollo local..."
cat > packages/backend/.env.production << EOF
# 🌐 MenuView.app Production Environment
NODE_ENV=production
PORT=3001

# Database (para desarrollo local usa la conexión directa)
DATABASE_URL="postgresql://menuview_user:$DB_PASSWORD@localhost:5432/menuview_prod"

# JWT Secrets
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRES_IN="7d"
SUPER_ADMIN_JWT_SECRET="$SUPER_JWT_SECRET"
SUPER_ADMIN_JWT_EXPIRES_IN="24h"

# Google Cloud Platform
GCP_PROJECT_ID="$PROJECT_ID"
GCP_STORAGE_BUCKET="$BUCKET_NAME"
GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"

# URLs
FRONTEND_URL="https://menuview.app"
EOF

print_status "Archivo .env.production creado"

# Generar service account key para desarrollo local
print_info "Generando credenciales para desarrollo local..."
gcloud iam service-accounts keys create packages/backend/service-account-key.json \
    --iam-account=$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com

print_status "Credenciales descargadas a packages/backend/service-account-key.json"

# Información final
echo ""
echo "🎉 ¡Configuración de GCP completada!"
echo "=================================="
print_info "Proyecto: $PROJECT_ID"
print_info "Región: $REGION"
print_info "Base de datos: $DB_INSTANCE"
print_info "Bucket: gs://$BUCKET_NAME"
print_info "Service Account: $SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
echo ""
print_warning "CREDENCIALES IMPORTANTES:"
echo "📧 Super Admin Email: admin@menuview.app"
echo "🔐 Super Admin Password: $SUPER_USER_PASSWORD"
echo "🗄️ DB Password: $DB_PASSWORD"
echo ""
print_info "Para deployar la aplicación:"
echo "1. Configura GitHub Secrets con el service account key"
echo "2. Haz push a la rama 'main' para activar el deployment"
echo "3. Configura los DNS records para menuview.app"
echo ""
print_warning "¡Guarda estas credenciales en un lugar seguro!" 