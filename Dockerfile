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

# Instalar Nginx.
USER root
RUN apk add --no-cache nginx

# Crear un directorio de aplicación.
WORKDIR /app

# Copiar el backend compilado a un subdirectorio para mantenerlo encapsulado.
COPY --from=build-backend /app/packages/backend ./backend

# Copiar las dependencias de producción a la raíz de /app.
# Node.js buscará en directorios superiores, así que /app/backend encontrará /app/node_modules.
COPY --from=build-backend /app/node_modules ./node_modules

# Configurar Nginx.
RUN rm -f /etc/nginx/http.d/default.conf
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copiar el frontend compilado a la raíz web de Nginx.
COPY --from=build-frontend /app/packages/frontend/dist /usr/share/nginx/html

# Copiar y dar permisos al script de inicio.
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Exponer el puerto que Cloud Run utiliza.
EXPOSE 8080

# Iniciar el script.
CMD ["/start.sh"] 