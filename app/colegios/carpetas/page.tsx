import { prisma } from "@/lib/prisma";
import { CarpetasEditor, CarpetasPageHeader } from "@/components/CarpetasEditor";

export const dynamic = "force-dynamic";

export default async function CarpetasPage() {
  const colegios = await prisma.colegio.findMany({
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      googleDriveFolderId: true,
      onedriveFolderId: true,
      googleDriveOutputFolderId: true,
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <CarpetasPageHeader />
      {colegios.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          Encara no hi ha centres. Executa{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run seed</code> primer.
        </div>
      ) : (
        <CarpetasEditor colegios={colegios} />
      )}
    </div>
  );
}
