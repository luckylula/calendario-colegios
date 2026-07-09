-- CreateEnum
CREATE TYPE "TipoPersonal" AS ENUM ('monitor', 'coordinador');

-- AlterTable
ALTER TABLE "calendarios_curso"
ADD COLUMN "tipo_personal" "TipoPersonal" NOT NULL DEFAULT 'monitor',
ADD COLUMN "horas_semanales" DOUBLE PRECISION NOT NULL DEFAULT 37.5;
