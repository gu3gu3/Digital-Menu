-- AlterTable
ALTER TABLE "restaurantes" ADD COLUMN     "fechaAsignacionPartner" TIMESTAMP(3),
ADD COLUMN     "partnerId" TEXT;

-- CreateTable
CREATE TABLE "usuarios_partner" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombreAgencia" TEXT NOT NULL,
    "nombreContacto" TEXT NOT NULL,
    "telefono" TEXT,
    "porcentajeComision" INTEGER NOT NULL DEFAULT 30,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_partner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_partner_email_key" ON "usuarios_partner"("email");

-- AddForeignKey
ALTER TABLE "restaurantes" ADD CONSTRAINT "restaurantes_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "usuarios_partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
