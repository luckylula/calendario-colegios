-- CreateEnum
CREATE TYPE "EstadoCalendario" AS ENUM ('borrador', 'confirmado');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('vacaciones', 'festivo_oficial', 'festivo_lliure_disposicio', 'jornada_intensiva', 'jornada_continuada', 'festivo_local');

-- CreateTable
CREATE TABLE "colegios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "google_drive_folder_id" TEXT NOT NULL,
    "onedrive_folder_id" TEXT NOT NULL,
    "google_drive_output_folder_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colegios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendarios_curso" (
    "id" TEXT NOT NULL,
    "colegio_id" TEXT NOT NULL,
    "curso" TEXT NOT NULL,
    "inicio_curso" DATE NOT NULL,
    "fin_curso" DATE NOT NULL,
    "estado" "EstadoCalendario" NOT NULL DEFAULT 'borrador',
    "creado_via_ia" BOOLEAN NOT NULL DEFAULT false,
    "fecha_generacion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendarios_curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_calendario" (
    "id" TEXT NOT NULL,
    "calendario_id" TEXT NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_calendario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendarios_curso_colegio_id_idx" ON "calendarios_curso"("colegio_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendarios_curso_colegio_id_curso_key" ON "calendarios_curso"("colegio_id", "curso");

-- CreateIndex
CREATE INDEX "eventos_calendario_calendario_id_idx" ON "eventos_calendario"("calendario_id");

-- AddForeignKey
ALTER TABLE "calendarios_curso" ADD CONSTRAINT "calendarios_curso_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_calendario" ADD CONSTRAINT "eventos_calendario_calendario_id_fkey" FOREIGN KEY ("calendario_id") REFERENCES "calendarios_curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;
