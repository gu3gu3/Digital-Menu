/*
  Warnings:

  - You are about to drop the column `imagenUrl` on the `categorias` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `items_orden` table. All the data in the column will be lost.
  - You are about to alter the column `precioUnitario` on the `items_orden` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `subtotal` on the `items_orden` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to drop the column `activa` on the `mesas` table. All the data in the column will be lost.
  - You are about to drop the column `descripcion` on the `mesas` table. All the data in the column will be lost.
  - You are about to drop the column `qrCode` on the `mesas` table. All the data in the column will be lost.
  - You are about to drop the column `qrImageUrl` on the `mesas` table. All the data in the column will be lost.
  - You are about to drop the column `fechaCompletada` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `fechaConfirmacion` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `fechaOrden` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `meseroId` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `nombreClienteFactura` on the `ordenes` table. All the data in the column will be lost.
  - The `estado` column on the `ordenes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `subtotal` on the `ordenes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `total` on the `ordenes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to drop the column `descripcion` on the `planes` table. All the data in the column will be lost.
  - You are about to drop the column `limiteMesas` on the `planes` table. All the data in the column will be lost.
  - You are about to drop the column `limiteMeseros` on the `planes` table. All the data in the column will be lost.
  - You are about to drop the column `limiteOrdenes` on the `planes` table. All the data in the column will be lost.
  - You are about to alter the column `precio` on the `planes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `precio` on the `productos` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - The `moneda` column on the `restaurantes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `clienteNombre` on the `sesiones` table. All the data in the column will be lost.
  - You are about to drop the column `clienteTelefono` on the `sesiones` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `sesiones` table. All the data in the column will be lost.
  - You are about to drop the column `finSesion` on the `sesiones` table. All the data in the column will be lost.
  - You are about to drop the column `inicioSesion` on the `sesiones` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `sesiones` table. All the data in the column will be lost.
  - You are about to drop the column `numeroPersonas` on the `sesiones` table. All the data in the column will be lost.
  - You are about to drop the column `sessionToken` on the `sesiones` table. All the data in the column will be lost.
  - You are about to drop the column `ultimaActividad` on the `sesiones` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `sesiones` table. All the data in the column will be lost.
  - You are about to drop the column `fechaUltimoPago` on the `suscripciones` table. All the data in the column will be lost.
  - You are about to drop the column `mesesPagados` on the `suscripciones` table. All the data in the column will be lost.
  - You are about to drop the column `montoUltimoPago` on the `suscripciones` table. All the data in the column will be lost.
  - You are about to drop the column `notasAdmin` on the `suscripciones` table. All the data in the column will be lost.
  - You are about to drop the column `planId` on the `suscripciones` table. All the data in the column will be lost.
  - The `estado` column on the `suscripciones` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `notificaciones_usuarios` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usuarios_meseros` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[restauranteId,numeroOrden]` on the table `ordenes` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `numero` on the `mesas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `nombre` on table `mesas` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `numeroOrden` on the `ordenes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `limiteCategorias` to the `planes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `limiteUsuarios` to the `planes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "notificaciones_usuarios" DROP CONSTRAINT "notificaciones_usuarios_enviadaPorId_fkey";

-- DropForeignKey
ALTER TABLE "notificaciones_usuarios" DROP CONSTRAINT "notificaciones_usuarios_restauranteId_fkey";

-- DropForeignKey
ALTER TABLE "ordenes" DROP CONSTRAINT "ordenes_meseroId_fkey";

-- DropForeignKey
ALTER TABLE "sesiones" DROP CONSTRAINT "sesiones_mesaId_fkey";

-- DropForeignKey
ALTER TABLE "sesiones" DROP CONSTRAINT "sesiones_restauranteId_fkey";

-- DropForeignKey
ALTER TABLE "suscripciones" DROP CONSTRAINT "suscripciones_planId_fkey";

-- DropForeignKey
ALTER TABLE "usuarios_meseros" DROP CONSTRAINT "usuarios_meseros_restauranteId_fkey";

-- DropIndex
DROP INDEX "mesas_qrCode_key";

-- DropIndex
DROP INDEX "ordenes_numeroOrden_key";

-- DropIndex
DROP INDEX "productos_restauranteId_categoriaId_nombre_key";

-- DropIndex
DROP INDEX "sesiones_sessionToken_key";

-- AlterTable
ALTER TABLE "categorias" DROP COLUMN "imagenUrl";

-- AlterTable
ALTER TABLE "items_orden" DROP COLUMN "createdAt",
ALTER COLUMN "precioUnitario" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "subtotal" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "mesas" DROP COLUMN "activa",
DROP COLUMN "descripcion",
DROP COLUMN "qrCode",
DROP COLUMN "qrImageUrl",
ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "qrCodeUrl" TEXT,
DROP COLUMN "numero",
ADD COLUMN     "numero" INTEGER NOT NULL,
ALTER COLUMN "nombre" SET NOT NULL,
ALTER COLUMN "capacidad" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "ordenes" DROP COLUMN "fechaCompletada",
DROP COLUMN "fechaConfirmacion",
DROP COLUMN "fechaOrden",
DROP COLUMN "meseroId",
DROP COLUMN "nombreClienteFactura",
ADD COLUMN     "impuestos" DOUBLE PRECISION NOT NULL DEFAULT 0,
DROP COLUMN "numeroOrden",
ADD COLUMN     "numeroOrden" INTEGER NOT NULL,
DROP COLUMN "estado",
ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
ALTER COLUMN "subtotal" DROP DEFAULT,
ALTER COLUMN "subtotal" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "total" DROP DEFAULT,
ALTER COLUMN "total" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "planes" DROP COLUMN "descripcion",
DROP COLUMN "limiteMesas",
DROP COLUMN "limiteMeseros",
DROP COLUMN "limiteOrdenes",
ADD COLUMN     "analiticas" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "limiteCategorias" INTEGER NOT NULL,
ADD COLUMN     "limiteUsuarios" INTEGER NOT NULL,
ADD COLUMN     "soporteChat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "soporteEmail" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "precio" DROP DEFAULT,
ALTER COLUMN "precio" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "limiteProductos" DROP DEFAULT;

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "esDestacado" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "precio" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "restaurantes" ADD COLUMN     "configuracion" JSONB,
DROP COLUMN "moneda",
ADD COLUMN     "moneda" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "sesiones" DROP COLUMN "clienteNombre",
DROP COLUMN "clienteTelefono",
DROP COLUMN "estado",
DROP COLUMN "finSesion",
DROP COLUMN "inicioSesion",
DROP COLUMN "metadata",
DROP COLUMN "numeroPersonas",
DROP COLUMN "sessionToken",
DROP COLUMN "ultimaActividad",
DROP COLUMN "updatedAt",
ADD COLUMN     "activa" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "suscripciones" DROP COLUMN "fechaUltimoPago",
DROP COLUMN "mesesPagados",
DROP COLUMN "montoUltimoPago",
DROP COLUMN "notasAdmin",
DROP COLUMN "planId",
ADD COLUMN     "renovacionAutomatica" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "estado",
ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
ALTER COLUMN "fechaInicio" DROP DEFAULT;

-- DropTable
DROP TABLE "notificaciones_usuarios";

-- DropTable
DROP TABLE "usuarios_meseros";

-- DropEnum
DROP TYPE "EstadoOrden";

-- DropEnum
DROP TYPE "EstadoSesion";

-- DropEnum
DROP TYPE "EstadoSuscripcion";

-- DropEnum
DROP TYPE "Moneda";

-- DropEnum
DROP TYPE "RolUsuario";

-- DropEnum
DROP TYPE "TipoNotificacion";

-- DropEnum
DROP TYPE "TipoPlan";

-- CreateTable
CREATE TABLE "usuarios_mesero" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "pin" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "usuarios_mesero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones_usuario" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'INFO',
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restauranteId" TEXT NOT NULL,
    "enviadaPorId" TEXT,

    CONSTRAINT "notificaciones_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_mesero_email_key" ON "usuarios_mesero"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mesas_restauranteId_numero_key" ON "mesas"("restauranteId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_restauranteId_numeroOrden_key" ON "ordenes"("restauranteId", "numeroOrden");

-- AddForeignKey
ALTER TABLE "usuarios_mesero" ADD CONSTRAINT "usuarios_mesero_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "restaurantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones_usuario" ADD CONSTRAINT "notificaciones_usuario_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "restaurantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones_usuario" ADD CONSTRAINT "notificaciones_usuario_enviadaPorId_fkey" FOREIGN KEY ("enviadaPorId") REFERENCES "super_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
