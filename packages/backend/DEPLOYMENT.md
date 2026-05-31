# Guía de Despliegue y Migraciones para Producción

Este documento detalla el procedimiento correcto para integrar despliegues automatizados (CI/CD) en el entorno de producción de Digital Menu sin afectar la integridad de los datos existentes.

## 1. Comandos de Prisma en CI/CD

El entorno de producción difiere del entorno de desarrollo. En desarrollo solemos destruir y recrear datos con fines de prueba, pero en producción los datos de clientes, planes y suscripciones son sagrados.

### Qué **HACER** en tu pipeline CI/CD:
Tras hacer el "pull" del código, debes instalar dependencias y sincronizar los cambios de la base de datos de manera segura usando:

```bash
# Si utilizas el flujo de "push" en Prisma (esquema vs base de datos)
npx prisma db push --accept-data-loss

# O, si llevas un historial estricto de migraciones SQL locales
npx prisma migrate deploy
```

> **Nota:** Se recomienda `npx prisma db push` para despliegues ágiles si no estás haciendo control de versiones estricto de los archivos `.sql` generados por Prisma en la carpeta `prisma/migrations`. Si sí llevas versionado de `.sql`, usa `migrate deploy`.

### Qué **NUNCA HACER** en tu pipeline CI/CD de Producción:
❌ **Nunca** uses `npx prisma db seed` ni `npm run db:seed`. (Esto sobreescribirá tus planes y configuraciones).
❌ **Nunca** uses `npx prisma migrate dev`. (Este comando requiere interacción o resetea la DB local).
❌ **Nunca** uses `npx prisma migrate reset`. (Este comando borrará TODA la base de datos en producción y la rellenará con el seed).

---

## 2. El script de Seed (`prisma/seed.js`)
El script de inicialización (`seed.js`) ha sido reestructurado para evitar accidentes si se llega a ejecutar en producción:
- Si se corre con `NODE_ENV=production`: Únicamente se cerciorará de que exista el Super Administrador (`admin@menuview.app`). **No creará ni actualizará** los planes (Emprendedor, Pro, Platinum, etc.), respetando los precios, límites y planes nuevos que tú hayas configurado manualmente desde el Dashboard de Super Administrador. Tampoco creará restaurantes de demostración.
- Si se corre en local o sin variables de entorno de producción: Rellenará la base de datos con planes por defecto, restaurantes dummy (La Parrilla Criolla, Don Ceviche, etc.) y meseros, ideal para probar la plataforma desde cero.

Para rellenar datos locales, simplemente ejecuta:
```bash
npm run db:seed
```

## 3. Resolución de Problemas (Troubleshooting)

**Error 500 al ver órdenes o estadísticas:**
`The column ordenes.servicio does not exist in the current database.`
**Causa:** Se subió un cambio en el archivo `schema.prisma` agregando la columna `servicio`, pero el pipeline CI/CD falló en sincronizar la base de datos, por lo que Prisma está intentando consultar una columna que aún no se crea en la DB real.
**Solución:** Ingresar al servidor de producción, navegar a la carpeta de backend y ejecutar `npx prisma db push`.
