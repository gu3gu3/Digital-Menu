#!/bin/sh

# Moverse al directorio del backend y iniciar el servidor de Node en segundo plano.
cd /app/backend
node dist/index.js &

# Iniciar Nginx en primer plano.
# Esto mantiene el contenedor activo y sirve el frontend.
exec nginx -g 'daemon off;' 