import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ColegioCard } from "@/components/ColegioCard";

export const dynamic = "force-dynamic";

export default async function ColegiosPage() {
  const colegios = await prisma.colegio.findMany({
    orderBy: { nombre: "asc" },
    include: {
      _count: { select: { calendarios: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Centres educatius</h1>
          <p className="mt-2 text-slate-600">
            Gestiona els calendaris escolars de cada centre. Introdueix les dates manualment
            o autocompleta des del PDF oficial.
          </p>
        </div>
        <Link
          href="/colegios/carpetas"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Configurar carpetes Drive/OneDrive
        </Link>
      </div>

      {colegios.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-600">Encara no hi ha centres registrats.</p>
          <p className="mt-2 text-sm text-slate-500">
            Executa <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run seed</code>{" "}
            després de configurar la base de dades.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colegios.map((colegio) => (
            <ColegioCard
              key={colegio.id}
              id={colegio.id}
              nombre={colegio.nombre}
              calendariosCount={colegio._count.calendarios}
            />
          ))}
        </div>
      )}
    </div>
  );
}
