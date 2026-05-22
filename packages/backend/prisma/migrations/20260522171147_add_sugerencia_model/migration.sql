-- CreateTable
CREATE TABLE "sugerencias" (
    "id" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "sugerencias_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sugerencias" ADD CONSTRAINT "sugerencias_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
