#!/bin/bash

# --- diagnose_connection.sh ---
# Script para diagnosticar problemas de conexión intermitentes en el entorno de desarrollo de Digital-Menu.
#
# Uso:
# 1. Dale permisos de ejecución: chmod +x diagnose_connection.sh
# 2. Ejecútalo desde la raíz del proyecto: ./diagnose_connection.sh
#
# Este script verificará:
# - Conexión a Internet básica.
# - Que los servicios de Frontend, Backend y Base de Datos estén escuchando en sus puertos.
# - El estado de la base de datos PostgreSQL.
# - Ofrecerá sugerencias basadas en los resultados.
# -----------------------------------------------------------------------------

# Colores para la salida
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Puertos y servicios
FRONTEND_PORT=5173
BACKEND_PORT=3001
DB_PORT=5432

echo -e "${YELLOW}--- Iniciando diagnóstico de conexión para Digital-Menu ---${NC}"

# --- 1. Verificación de Conexión a Internet ---
echo -e "\n[1/4] Verificando conexión a Internet..."
if ping -c 1 google.com &> /dev/null; then
  echo -e "${GREEN}✓ Conexión a Internet exitosa.${NC}"
else
  echo -e "${RED}✗ Error: No se pudo conectar a google.com. Verifica tu conexión de red.${NC}"
fi

# --- 2. Verificación de Puertos de Servicios Locales ---
echo -e "\n[2/4] Verificando puertos de los servicios locales..."

# Función para verificar un puerto
check_port() {
  local port=$1
  local service_name=$2
  local suggestion=$3

  # Usamos 'ss' que es más moderno y suele estar disponible. 'lsof' es una alternativa.
  if ss -tuln | grep -q ":$port "; then
    echo -e "  ${GREEN}✓ El servicio de ${service_name} está activo y escuchando en el puerto ${port}.${NC}"
  else
    echo -e "  ${RED}✗ Error: No se encontró ningún servicio escuchando en el puerto ${port} (${service_name}).${NC}"
    echo -e "    ${YELLOW}Sugerencia: ${suggestion}${NC}"
  fi
}

check_port $FRONTEND_PORT "Frontend" "Asegúrate de haber ejecutado 'npm run dev' en la carpeta 'packages/frontend'."
check_port $BACKEND_PORT "Backend" "Asegúrate de haber ejecutado 'npm run dev' en la carpeta 'packages/backend'."
check_port $DB_PORT "Base de Datos (PostgreSQL)" "Asegúrate de que tu servicio de PostgreSQL esté en ejecución. Puedes intentar con 'sudo systemctl start postgresql'."


# --- 3. Verificación de la Base de Datos PostgreSQL ---
echo -e "\n[3/4] Verificando el estado del servidor PostgreSQL..."
# pg_isready es una utilidad de PostgreSQL para chequear el estado de la conexión.
if pg_isready -h localhost -p $DB_PORT -q; then
    echo -e "${GREEN}✓ El servidor de PostgreSQL está listo para aceptar conexiones.${NC}"
else
    echo -e "${RED}✗ Error: El servidor PostgreSQL no responde en localhost:${DB_PORT}.${NC}"
    echo -e "  ${YELLOW}Sugerencia: Verifica el estado del servicio con 'sudo systemctl status postgresql' y reinícialo si es necesario con 'sudo systemctl restart postgresql'.${NC}"
fi

# --- 4. Comprobación final y Siguientes Pasos ---
echo -e "\n[4/4] Resumen y próximos pasos..."
echo "Si todos los chequeos anteriores fueron exitosos pero el problema persiste, considera estas causas:"
echo "  - ${YELLOW}Problema de CORS:${NC} Revisa la consola del navegador (F12) en busca de errores de CORS. Si aparecen, la configuración en 'packages/backend/src/index.js' podría ser incorrecta."
echo "  - ${YELLOW}Cliente Prisma desactualizado:${NC} A veces, el cliente Prisma no se regenera correctamente. Para forzar una limpieza total, detén todos los servicios y ejecuta los siguientes comandos desde la raíz:"
echo "    1. ${YELLOW}rm -rf node_modules/**/node_modules packages/backend/node_modules packages/frontend/node_modules node_modules${NC}"
echo "    2. ${YELLOW}npm install${NC}"
echo "    3. ${YELLOW}npx prisma generate --schema=./packages/backend/prisma/schema.prisma${NC}"
echo "    4. ${YELLOW}cd packages/backend && npx prisma migrate dev && cd ../..${NC}"
echo ""
echo -e "${YELLOW}--- Diagnóstico completado ---${NC}" 