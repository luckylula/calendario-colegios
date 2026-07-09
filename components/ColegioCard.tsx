import Link from "next/link";

interface ColegioCardProps {
  id: string;
  nombre: string;
  calendariosCount: number;
}

export function ColegioCard({ id, nombre, calendariosCount }: ColegioCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <h2 className="text-lg font-semibold text-slate-900">{nombre}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {calendariosCount === 0
          ? "Cap calendari generat"
          : `${calendariosCount} calendari${calendariosCount === 1 ? "" : "s"}`}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/colegios/${id}/nuevo-curso`}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Nou calendari de curs
        </Link>
        <Link
          href={`/colegios/${id}/historial`}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Historial
        </Link>
      </div>
    </article>
  );
}
