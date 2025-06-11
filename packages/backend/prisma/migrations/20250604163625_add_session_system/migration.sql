/*
  Warnings:

  - The values [LISTA_PARA_SERVIR] on the enum `EstadoOrden` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "EstadoSesion" AS ENUM ('ACTIVA', 'INACTIVA', 'CERRADA', 'EXPIRADA');

-- AlterEnum
BEGIN;
CREATE TYPE "EstadoOrden_new" AS ENUM ('ENVIADA', 'RECIBIDA', 'CONFIRMADA', 'EN_PREPARACION', 'LISTA', 'SERVIDA', 'COMPLETADA', 'CANCELADA');
ALTER TABLE "ordenes" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "ordenes" ALTER COLUMN "estado" TYPE "EstadoOrden_new" USING ("estado"::text::"EstadoOrden_new");
ALTER TYPE "EstadoOrden" RENAME TO "EstadoOrden_old";
ALTER TYPE "EstadoOrden_new" RENAME TO "EstadoOrden";
DROP TYPE "EstadoOrden_old";
ALTER TABLE "ordenes" ALTER COLUMN "estado" SET DEFAULT 'ENVIADA';
COMMIT;

-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "sesionId" TEXT;

-- CreateTable
CREATE TABLE "sesiones" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "restauranteId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "clienteNombre" TEXT,
    "clienteTelefono" TEXT,
    "numeroPersonas" INTEGER NOT NULL DEFAULT 1,
    "estado" "EstadoSesion" NOT NULL DEFAULT 'ACTIVA',
    "inicioSesion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finSesion" TIMESTAMP(3),
    "ultimaActividad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_sessionToken_key" ON "sesiones"("sessionToken");

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "sesiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
