#!/bin/sh
set -e

# Iniciar el servidor de Node en segundo plano.
# Gracias a la variable NODE_ENV=production, escuchará en el puerto 3001.
echo "Iniciando servidor de Node.js..."
node dist/src/index.js &

# Iniciar Nginx en primer plano, que escuchará en el puerto 8080.
echo "Iniciando Nginx..."
exec nginx -g 'daemon off;' 