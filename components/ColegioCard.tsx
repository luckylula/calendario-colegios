import Image from "next/image";
import Link from "next/link";
import { LOGO_SRC } from "@/lib/branding";

interface ColegioCardProps {
  id: string;
  nombre: string;
  calendariosCount: number;
}

export function ColegioCard({ id, nombre, calendariosCount }: ColegioCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <h2 className="text-lg font-semibold text-slate-900">{nombre}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {calendariosCount === 0
          ? "Cap calendari generat"
          : `${calendariosCount} calendari${calendariosCount === 1 ? "" : "s"}`}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/colegios/${id}/nuevo-curso`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-800 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-900"
        >
          <span className="flex h-7 items-center rounded-md bg-white px-1.5">
            <Image
              src={LOGO_SRC}
              alt=""
              width={72}
              height={24}
              className="h-5 w-auto object-contain"
              aria-hidden
            />
          </span>
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
