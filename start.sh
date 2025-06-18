#!/bin/sh
set -e

# Iniciar el servidor de Node en segundo plano.
echo "Iniciando servidor de Node.js..."
node dist/src/index.js &

# Iniciar Nginx en primer plano.
echo "Iniciando Nginx..."
exec nginx -g 'daemon off;' 