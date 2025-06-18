#!/bin/sh
set -e

# Iniciar el servidor de Node en segundo plano.
# Se ejecuta desde /app, que es nuestro WORKDIR.
echo "Iniciando servidor de Node.js..."
node dist/index.js &

# Iniciar Nginx en primer plano.
echo "Iniciando Nginx..."
exec nginx -g 'daemon off;' 