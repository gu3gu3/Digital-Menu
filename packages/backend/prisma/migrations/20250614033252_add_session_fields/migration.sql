-- AlterTable
ALTER TABLE "sesiones" ADD COLUMN     "clienteNombre" TEXT,
ADD COLUMN     "clienteTelefono" TEXT,
ADD COLUMN     "finSesion" TIMESTAMP(3),
ADD COLUMN     "numeroPersonas" INTEGER,
ADD COLUMN     "ultimaActividad" TIMESTAMP(3);
