BEGIN;

-- 1. Primero, aseguramos que Bella Vista use uno de los nuevos planes para no bloquear el borrado
UPDATE "restaurantes" 
SET "planId" = (SELECT "id" FROM "planes" WHERE "nombre" = 'Plan Emprendedor' LIMIT 1) 
WHERE "slug" = 'bella-vista';

-- 2. Borrar todos los registros que dependen de los restaurantes a eliminar (todo excepto Bella Vista)
DELETE FROM "items_orden" WHERE "ordenId" IN (SELECT "id" FROM "ordenes" WHERE "restauranteId" IN (SELECT "id" FROM "restaurantes" WHERE "slug" != 'bella-vista'));
DELETE FROM "ordenes" WHERE "restauranteId" IN (SELECT "id" FROM "restaurantes" WHERE "slug" != 'bella-vista');
DELETE FROM "sesiones" WHERE "restauranteId" IN (SELECT "id" FROM "restaurantes" WHERE "slug" != 'bella-vista');
DELETE FROM "notificaciones_usuario" WHERE "restauranteId" IN (SELECT "id" FROM "restaurantes" WHERE "slug" != 'bella-vista');
DELETE FROM "usuarios_mesero" WHERE "restauranteId" IN (SELECT "id" FROM "restaurantes" WHERE "slug" != 'bella-vista');
DELETE FROM "usuarios_admin" WHERE "restauranteId" IN (SELECT "id" FROM "restaurantes" WHERE "slug" != 'bella-vista');
DELETE FROM "historial_pagos" WHERE "suscripcionId" IN (SELECT "id" FROM "suscripciones" WHERE "restauranteId" IN (SELECT "id" FROM "restaurantes" WHERE "slug" != 'bella-vista'));
DELETE FROM "suscripciones" WHERE "restauranteId" IN (SELECT "id" FROM "restaurantes" WHERE "slug" != 'bella-vista');
DELETE FROM "productos" WHERE "restauranteId" IN (SELECT "id" FROM "restaurantes" WHERE "slug" != 'bella-vista');
DELETE FROM "categorias" WHERE "restauranteId" IN (SELECT "id" FROM "restaurantes" WHERE "slug" != 'bella-vista');
DELETE FROM "mesas" WHERE "restauranteId" IN (SELECT "id" FROM "restaurantes" WHERE "slug" != 'bella-vista');

-- 3. Borrar los restaurantes en sí
DELETE FROM "restaurantes" WHERE "slug" != 'bella-vista';

-- 4. Finalmente, borrar todos los planes antiguos (Gratuito, Básico, Gold, etc.)
DELETE FROM "planes" WHERE "nombre" NOT IN ('Plan Emprendedor', 'Plan Crecimiento', 'Plan Pro', 'Plan Platinum');

COMMIT;
