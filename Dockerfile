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

# Instalar Nginx y realizar limpieza. Corremos como root temporalmente.
USER root
RUN apk add --no-cache nginx

# Eliminar la configuración por defecto de Nginx para evitar conflictos
RUN rm -f /etc/nginx/http.d/default.conf

# Copiar nuestra configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/http.d/default.conf

# Establecer el directorio de trabajo a la raíz web de Nginx
WORKDIR /usr/share/nginx/html

# Copiar el build del frontend desde la etapa de construcción a la raíz de Nginx
COPY --from=build-frontend /app/packages/frontend/dist .

# Copiar los artefactos del backend y sus dependencias
COPY --from=build-backend /app/node_modules ./node_modules
COPY --from=build-backend /app/packages/backend/dist ./dist
COPY --from=build-backend /app/package.json ./package.json

# Copiar y dar permisos de ejecución al script de inicio
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Exponer el puerto 8080 que Cloud Run utiliza
EXPOSE 8080

# El script se encarga de iniciar Nginx y Node
CMD ["/start.sh"] 