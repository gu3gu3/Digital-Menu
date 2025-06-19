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

# Etapa 3: Servidor de producción final
FROM node:20-slim

# Instalar Nginx y Netcat en la imagen de Debian
USER root
RUN apt-get update && apt-get install -y --no-install-recommends nginx netcat-openbsd && rm -rf /var/lib/apt/lists/*

# 1. Establecer el directorio de trabajo para el backend.
# Esta será la ubicación principal desde donde se ejecutará Node.
WORKDIR /app

# 2. Copiar las dependencias de producción del backend.
COPY --from=build-backend /app/node_modules ./node_modules
# Copiar el código compilado del backend.
COPY --from=build-backend /app/packages/backend/dist ./dist
# Copiar el package.json del backend.
COPY --from=build-backend /app/packages/backend/package.json ./package.json
# Copiar el schema de Prisma es crucial para producción.
COPY --from=build-backend /app/packages/backend/prisma ./prisma

# 3. Configurar Nginx.
# La ruta de configuración de Nginx en Debian es diferente a la de Alpine.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 4. Copiar el frontend compilado a su directorio.
COPY --from=build-frontend /app/packages/frontend/dist /usr/share/nginx/html

# 5. Copiar y dar permisos al script de inicio.
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Exponer el puerto de Cloud Run.
EXPOSE 8080

# Iniciar el script.
CMD ["/start.sh"] 