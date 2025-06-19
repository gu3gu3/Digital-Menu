#!/bin/sh
set -e

# Iniciar el servidor de Node en segundo plano.
echo "Iniciando servidor de Node.js..."
node dist/src/index.js &

# Esperar a que el backend de Node.js esté listo en el puerto 3001
echo "Esperando a que el backend esté listo en el puerto 3001..."
while ! nc -z localhost 3001; do   
  sleep 1 # esperar 1 segundo antes de reintentar
done
echo "✅ Backend listo y escuchando en el puerto 3001."

# Iniciar Nginx en primer plano, ahora que el backend está listo.
echo "Iniciando Nginx..."
exec nginx -g 'daemon off;' 