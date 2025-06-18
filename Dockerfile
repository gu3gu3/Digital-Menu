# Etapa 1: Construir el Backend
FROM node:20 AS build-backend
WORKDIR /app

# Copiar primero los manifiestos del paquete
COPY package*.json ./
# Copiar TODO el código fuente para que npm vea los workspaces
COPY . .
# Ahora, instalar todas las dependencias
RUN npm install

# Generar el cliente de Prisma, especificando la ruta al schema
RUN npx prisma generate --schema=./packages/backend/prisma/schema.prisma

# Ejecutar el build del backend
RUN npm run build --workspace=backend

# Etapa 2: Construir el Frontend
FROM node:20 AS build-frontend
WORKDIR /app

# Copiar primero los manifiestos del paquete
COPY package*.json ./
# Copiar TODO el código fuente para que npm vea los workspaces
COPY . .
# Ahora, instalar todas las dependencias
RUN npm install

# Construir el frontend
RUN npm run build --workspace=frontend

# Etapa 3: Servidor de producción con Node y Nginx
FROM node:20-alpine

# Instalar Nginx y dependencias. Corremos como root temporalmente.
USER root
RUN apk add --no-cache nginx

# 1. Crear y establecer el directorio de trabajo para el backend
WORKDIR /app

# 2. Copiar los artefactos del backend a /app
# Es importante copiar el package.json específico del backend para dependencias de producción
COPY --from=build-backend /app/packages/backend/package.json ./package.json
# Asegúrate de tener un script "start" en tu backend/package.json, ej: "start": "node dist/index.js"
COPY --from=build-backend /app/packages/backend/dist ./dist
COPY --from=build-backend /app/node_modules ./node_modules

# 3. Configurar Nginx
# Eliminar la configuración por defecto para evitar conflictos
RUN rm -f /etc/nginx/http.d/default.conf
# Copiar nuestra configuración personalizada
COPY nginx.conf /etc/nginx/http.d/default.conf

# 4. Copiar el build del frontend a la raíz web de Nginx
COPY --from=build-frontend /app/packages/frontend/dist /usr/share/nginx/html

# 5. Copiar y dar permisos de ejecución al script de inicio
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Exponer el puerto 8080 que Cloud Run utiliza
EXPOSE 8080

# El script se encarga de iniciar Nginx y Node
CMD ["/start.sh"] 