# Fase 1: Build - Instalar dependencias y construir los paquetes
FROM node:20-slim AS build

WORKDIR /app

# Copiar los package.json y package-lock.json de la raíz y de los workspaces
COPY package.json package-lock.json ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/backend/package.json ./packages/backend/

# Instalar dependencias de todos los workspaces
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Generar el cliente de Prisma (esencial para que el backend funcione)
RUN npm run db:generate --workspace=backend

# Construir el frontend para producción
RUN npm run build --workspace=frontend

# Fase 2: Producción - Crear la imagen final y ligera
FROM node:20-slim

WORKDIR /app

# Copiar las dependencias instaladas desde la fase de build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

# Copiar el backend construido
COPY --from=build /app/packages/backend ./packages/backend

# Copiar el frontend construido
COPY --from=build /app/packages/frontend/dist ./packages/frontend/dist

# Exponer el puerto en el que correrá el servidor
# App Engine (y Cloud Run) inyecta la variable PORT.
# Nuestro backend está configurado para usar process.env.PORT || 3001
EXPOSE 8080

# Comando para iniciar el servidor de producción del backend
# Cloud Run inyectará la variable PORT, y nuestro servidor la usará.
CMD ["npm", "start", "--workspace=backend"] 