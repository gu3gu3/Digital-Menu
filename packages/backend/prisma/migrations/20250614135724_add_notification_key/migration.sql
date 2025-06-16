/*
  Warnings:

  - A unique constraint covering the columns `[notificationKey]` on the table `notificaciones_usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "notificaciones_usuario" ADD COLUMN     "notificationKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "notificaciones_usuario_notificationKey_key" ON "notificaciones_usuario"("notificationKey");
