import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/colegios" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
            CP
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Control Play</p>
            <p className="text-xs text-slate-500">Calendari Escolar</p>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          <Link href="/colegios" className="hover:text-emerald-700">
            Centres educatius
          </Link>
          <Link href="/colegios/carpetas" className="hover:text-emerald-700">
            Carpetes
          </Link>
        </nav>
      </div>
    </header>
  );
}
