import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME, BRAND_SUBTITLE, LOGO_SRC } from "@/lib/branding";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/colegios" className="flex items-center gap-3">
          <Image
            src={LOGO_SRC}
            alt={BRAND_NAME}
            width={220}
            height={48}
            className="h-11 w-auto max-w-[220px] object-contain object-left"
            priority
          />
          <span className="hidden border-l border-slate-200 pl-3 text-xs font-medium text-slate-500 sm:inline">
            {BRAND_SUBTITLE}
          </span>
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
