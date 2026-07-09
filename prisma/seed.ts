import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "../generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { COLEGIOS_CARPETAS } from "./data/colegios-carpetas";

const root = process.cwd();
config({ path: path.join(root, ".env") });
config({ path: path.join(root, ".env.local") });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const deleted = await prisma.colegio.deleteMany();
  console.log(`🗑️  Eliminados ${deleted.count} colegio(s) anteriores`);

  for (const colegio of COLEGIOS_CARPETAS) {
    await prisma.colegio.create({
      data: {
        nombre: colegio.nombre,
        nombreCarpetaDrive: colegio.nombreCarpetaDrive,
        googleDriveFolderId: "PENDIENTE_GOOGLE_DRIVE",
        onedriveFolderId: "PENDIENTE_ONEDRIVE",
        googleDriveOutputFolderId: null,
      },
    });
    console.log(`✅ ${colegio.nombre} ← "${colegio.nombreCarpetaDrive}"`);
  }

  await prisma.$disconnect();
  await pool.end();
  console.log(`\n🎉 ${COLEGIOS_CARPETAS.length} colegios reales cargados.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
