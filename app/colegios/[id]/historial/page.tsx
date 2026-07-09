import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateDisplay } from "@/lib/constants";
import { HistorialActions } from "@/components/HistorialActions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

const ESTADO_LABELS = {
  borrador: "Esborrany",
  confirmado: "Confirmat",
} as const;

export default async function HistorialPage({ params }: PageProps) {
  const { id } = await params;

  const colegio = await prisma.colegio.findUnique({
    where: { id },
    include: {
      calendarios: {
        orderBy: { curso: "desc" },
        include: {
          _count: { select: { eventos: true } },
        },
      },
    },
  });

  if (!colegio) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/colegios"
        className="mb-6 inline-flex text-sm text-slate-500 hover:text-emerald-700"
      >
        ← Tornar als centres
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">{colegio.nombre}</h1>
        <p className="mt-2 text-slate-600">Historial de calendaris generats</p>
      </div>

      {colegio.calendarios.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-600">Encara no hi ha calendaris per a aquest centre.</p>
          <Link
            href={`/colegios/${id}/nuevo-curso`}
            className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Crear primer calendari
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {colegio.calendarios.map((calendario) => (
            <article
              key={calendario.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Curs {calendario.curso}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {calendario._count.eventos} esdeveniments ·{" "}
                  <span
                    className={
                      calendario.estado === "confirmado"
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }
                  >
                    {ESTADO_LABELS[calendario.estado]}
                  </span>
                  {calendario.fechaGeneracion && (
                    <>
                      {" "}
                      · Generat el {formatDateDisplay(calendario.fechaGeneracion)}
                    </>
                  )}
                </p>
              </div>
              <HistorialActions
                colegioId={id}
                calendarioId={calendario.id}
                estado={calendario.estado}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
