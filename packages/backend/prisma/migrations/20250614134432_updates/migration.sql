/*
  Warnings:

  - A unique constraint covering the columns `[restauranteId,nombre]` on the table `productos` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "productos_restauranteId_nombre_key" ON "productos"("restauranteId", "nombre");
