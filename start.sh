#!/bin/sh
set -e

echo "============================================================"
echo "MODO DE DEPURACIÓN FINAL: EJECUTANDO SOLO EL BACKEND"
echo "Se intentará iniciar el servidor de Node.js en primer plano."
echo "Nginx no se iniciará. Se espera que la UI no cargue."
echo "Buscando logs del servidor Node.js a continuación..."
echo "============================================================"

# Ejecutar Node.js en primer plano para capturar todos los logs
node dist/src/index.js 