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

# Etapa 3: Servidor de producción con Nginx
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Eliminar la configuración por defecto de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d

# Copiar el build del frontend desde la etapa de construcción
COPY --from=build-frontend /app/packages/frontend/dist .

# Copiar el build del backend desde la etapa de construcción
COPY --from=build-backend /app/node_modules ./node_modules
COPY --from=build-backend /app/packages/backend/dist ./dist
COPY --from=build-backend /app/package.json ./package.json

# Exponer el puerto 8080 (puerto estándar que Cloud Run espera)
EXPOSE 8080

# Iniciar Nginx y el servidor de Node en segundo plano
# Usaremos un script para iniciar ambos procesos
COPY start.sh /
RUN chmod +x /start.sh
CMD ["/start.sh"] 