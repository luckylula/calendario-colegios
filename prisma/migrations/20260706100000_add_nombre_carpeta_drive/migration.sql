-- AlterTable
ALTER TABLE "colegios" ADD COLUMN "nombre_carpeta_drive" TEXT;

-- Backfill placeholder for any existing rows before NOT NULL
UPDATE "colegios" SET "nombre_carpeta_drive" = UPPER("nombre") WHERE "nombre_carpeta_drive" IS NULL;

ALTER TABLE "colegios" ALTER COLUMN "nombre_carpeta_drive" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "colegios_nombre_carpeta_drive_key" ON "colegios"("nombre_carpeta_drive");
