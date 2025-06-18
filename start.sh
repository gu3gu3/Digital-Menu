#!/bin/sh

# Iniciar el servidor de backend de Node.js en segundo plano.
# Nos movemos a su directorio /app y lo iniciamos.
cd /app
node dist/index.js &

# Iniciar Nginx en primer plano. Esto mantiene el contenedor activo.
# Nginx servirá el frontend y actuará como proxy para el backend.
exec nginx -g 'daemon off;' 