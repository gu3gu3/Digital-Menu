-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "preparacionFinishedAt" TIMESTAMP(3),
ADD COLUMN     "preparacionStartedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "usuarios_mesero" ADD COLUMN     "rol" TEXT NOT NULL DEFAULT 'MESERO';
