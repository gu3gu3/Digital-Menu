# Etapa 1: Construir el Backend
FROM node:18 AS build-backend
WORKDIR /app

# Copiar solo los archivos de manifiesto del monorepo
COPY package.json package-lock.json ./

# Instalar todas las dependencias (incluidas las de desarrollo para la compilación)
RUN npm install

# Copiar todo el código fuente
COPY . .

# Generar el cliente de Prisma
RUN npx prisma generate

# Ejecutar el build del backend (si existe un script para ello)
# Asegúrate de que tu package.json tenga un script "build" en el workspace del backend
RUN npm run build --workspace=backend

# Etapa 2: Construir el Frontend
FROM node:18 AS build-frontend
WORKDIR /app

# Copiar solo los archivos de manifiesto del monorepo
COPY package.json package-lock.json ./

# Instalar todas las dependencias
RUN npm install

# Copiar el código del frontend
COPY ./packages/frontend ./packages/frontend

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