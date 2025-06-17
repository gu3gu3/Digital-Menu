#!/bin/sh

# Iniciar el servidor de backend de Node.js en segundo plano
# Nos movemos al directorio donde está el código del backend
cd /usr/share/nginx/html
# Usamos 'node .' para iniciar el servidor basado en el package.json
node ./dist/server.js &

# Iniciar Nginx en primer plano
# 'daemon off;' es crucial para que Nginx no se vaya a segundo plano
# y mantenga el contenedor activo.
nginx -g 'daemon off;' 