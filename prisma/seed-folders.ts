import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "../generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { COLEGIOS_CARPETAS } from "./data/colegios-carpetas";
import { isFolderIdConfigured, normalizeFolderId } from "../lib/folder-id";

const root = process.cwd();
config({ path: path.join(root, ".env") });
config({ path: path.join(root, ".env.local") });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  let creados = 0;
  let actualizados = 0;
  let omitidos = 0;
  const pendientes: string[] = [];

    for (const colegio of COLEGIOS_CARPETAS) {
    const googleDriveFolderId = normalizeFolderId(colegio.googleDriveFolderId);
    const onedriveFolderId = normalizeFolderId(colegio.onedriveFolderId);
    const googleDriveOutputFolderId = colegio.googleDriveOutputFolderId
      ? normalizeFolderId(colegio.googleDriveOutputFolderId)
      : null;

    const tieneIds =
      isFolderIdConfigured(googleDriveFolderId) &&
      isFolderIdConfigured(onedriveFolderId);

    const existing = await prisma.colegio.findFirst({
      where: { nombreCarpetaDrive: colegio.nombreCarpetaDrive },
    });

    if (!tieneIds) {
      pendientes.push(colegio.nombre);
      if (!existing) {
        await prisma.colegio.create({
          data: {
            nombre: colegio.nombre,
            nombreCarpetaDrive: colegio.nombreCarpetaDrive,
            googleDriveFolderId: googleDriveFolderId || "PENDIENTE_GOOGLE_DRIVE",
            onedriveFolderId: onedriveFolderId || "PENDIENTE_ONEDRIVE",
            googleDriveOutputFolderId,
          },
        });
        creados++;
        console.log(`➕ Creado (sin IDs): ${colegio.nombre}`);
      } else {
        omitidos++;
        console.log(`⏭️  Sin IDs aún: ${colegio.nombre}`);
      }
      continue;
    }

    if (existing) {
      await prisma.colegio.update({
        where: { id: existing.id },
        data: {
          googleDriveFolderId,
          onedriveFolderId,
          googleDriveOutputFolderId,
        },
      });
      actualizados++;
      console.log(`✅ Actualizado: ${colegio.nombre}`);
    } else {
      await prisma.colegio.create({
        data: {
          nombre: colegio.nombre,
          nombreCarpetaDrive: colegio.nombreCarpetaDrive,
          googleDriveFolderId,
          onedriveFolderId,
          googleDriveOutputFolderId,
        },
      });
      creados++;
      console.log(`✅ Creado: ${colegio.nombre}`);
    }
  }

  await prisma.$disconnect();
  await pool.end();

  console.log(`\n📊 Resumen: ${creados} creados, ${actualizados} actualizados, ${omitidos} omitidos`);
  if (pendientes.length > 0) {
    console.log(`\n⚠️  Faltan IDs para ${pendientes.length} colegio(s):`);
    pendientes.forEach((n) => console.log(`   - ${n}`));
    console.log("\nRellena prisma/data/colegios-carpetas.ts y vuelve a ejecutar npm run seed:folders");
  } else {
    console.log("\n🎉 Todos los colegios tienen IDs configurados.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
