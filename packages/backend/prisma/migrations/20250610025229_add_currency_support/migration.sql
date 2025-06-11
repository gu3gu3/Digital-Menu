-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('USD', 'NIO', 'CRC', 'HNL', 'GTQ', 'PAB', 'SVC');

-- CreateEnum
CREATE TYPE "EstadoSuscripcion" AS ENUM ('ACTIVA', 'VENCIDA', 'SUSPENDIDA', 'CANCELADA', 'BLOQUEADA');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('RENOVACION_PROXIMA', 'SUSCRIPCION_VENCIDA', 'CUENTA_SUSPENDIDA', 'PAGO_CONFIRMADO', 'UPGRADE_PLAN', 'BIENVENIDA');

-- AlterEnum
ALTER TYPE "RolUsuario" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "restaurantes" ADD COLUMN     "moneda" "Moneda" NOT NULL DEFAULT 'USD';

-- CreateTable
CREATE TABLE "suscripciones" (
    "id" TEXT NOT NULL,
    "restauranteId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "estado" "EstadoSuscripcion" NOT NULL DEFAULT 'ACTIVA',
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "fechaUltimoPago" TIMESTAMP(3),
    "mesesPagados" INTEGER NOT NULL DEFAULT 1,
    "montoUltimoPago" DECIMAL(65,30),
    "notasAdmin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_pagos" (
    "id" TEXT NOT NULL,
    "suscripcionId" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "mesesPagados" INTEGER NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodoPago" TEXT,
    "referenciaPago" TEXT,
    "procesadoPor" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones_usuarios" (
    "id" TEXT NOT NULL,
    "restauranteId" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fechaEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaLectura" TIMESTAMP(3),
    "enviadaPorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suscripciones_restauranteId_key" ON "suscripciones"("restauranteId");

-- CreateIndex
CREATE UNIQUE INDEX "super_usuarios_email_key" ON "super_usuarios"("email");

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_planId_fkey" FOREIGN KEY ("planId") REFERENCES "planes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_pagos" ADD CONSTRAINT "historial_pagos_suscripcionId_fkey" FOREIGN KEY ("suscripcionId") REFERENCES "suscripciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones_usuarios" ADD CONSTRAINT "notificaciones_usuarios_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones_usuarios" ADD CONSTRAINT "notificaciones_usuarios_enviadaPorId_fkey" FOREIGN KEY ("enviadaPorId") REFERENCES "super_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
