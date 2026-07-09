import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CalendarioForm } from "@/components/CalendarioForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editar?: string }>;
};

export default async function NuevoCursoPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { editar } = await searchParams;

  const colegio = await prisma.colegio.findUnique({ where: { id } });
  if (!colegio) notFound();

  let initialData;
  let calendarioId: string | undefined;

  if (editar) {
    const calendario = await prisma.calendarioCurso.findUnique({
      where: { id: editar },
      include: { eventos: true },
    });

    if (calendario && calendario.colegioId === id) {
      calendarioId = calendario.id;
      initialData = {
        curso: calendario.curso,
        inicioCurso: calendario.inicioCurso.toISOString().slice(0, 10),
        finCurso: calendario.finCurso.toISOString().slice(0, 10),
        tipoPersonal: calendario.tipoPersonal ?? "monitor",
        horasSemanales: calendario.horasSemanales ?? 13,
        creadoViaIa: calendario.creadoViaIa,
        eventos: calendario.eventos.map((e) => ({
          tipo: e.tipo,
          nombre: e.nombre,
          fechaInicio: e.fechaInicio.toISOString().slice(0, 10),
          fechaFin: e.fechaFin ? e.fechaFin.toISOString().slice(0, 10) : null,
        })),
      };
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/colegios"
        className="mb-6 inline-flex text-sm text-slate-500 hover:text-emerald-700"
      >
        ← Tornar als centres
      </Link>
      <CalendarioForm
        colegioId={colegio.id}
        colegioNombre={colegio.nombre}
        initialData={initialData}
        calendarioId={calendarioId}
      />
    </div>
  );
}
