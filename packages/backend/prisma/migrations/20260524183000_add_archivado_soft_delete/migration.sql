-- AlterTable
ALTER TABLE "categorias" ADD COLUMN "archivado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "productos" ADD COLUMN "archivado" BOOLEAN NOT NULL DEFAULT false;
