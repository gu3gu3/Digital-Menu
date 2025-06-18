#!/bin/sh
set -e

# -- PASO DE DEPURACIÓN --
# Listar el contenido del directorio de trabajo y del directorio dist
# para ver qué hay realmente dentro del contenedor en producción.
echo "--- Contenido de /app: ---"
ls -la /app
echo "--- Contenido de /app/dist: ---"
ls -la /app/dist
echo "--------------------------"


# Iniciar el servidor de Node en segundo plano.
# Se ejecuta desde /app, que es nuestro WORKDIR.
echo "Iniciando servidor de Node.js..."
node dist/index.js &

# Iniciar Nginx en primer plano.
echo "Iniciando Nginx..."
exec nginx -g 'daemon off;' 