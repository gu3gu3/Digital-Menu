/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `restaurantes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "restaurantes_email_key" ON "restaurantes"("email");
