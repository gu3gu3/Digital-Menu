-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "meseroId" TEXT;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_meseroId_fkey" FOREIGN KEY ("meseroId") REFERENCES "usuarios_mesero"("id") ON DELETE SET NULL ON UPDATE CASCADE;
