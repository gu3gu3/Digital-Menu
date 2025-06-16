/*
  Warnings:

  - You are about to drop the column `limiteUsuarios` on the `planes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "planes" DROP COLUMN "limiteUsuarios",
ADD COLUMN     "limiteMesas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "limiteMeseros" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "limiteOrdenes" INTEGER NOT NULL DEFAULT 0;
