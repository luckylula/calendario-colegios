"use client";

import Link from "next/link";
import { useState } from "react";

interface HistorialActionsProps {
  colegioId: string;
  calendarioId: string;
  estado: "borrador" | "confirmado";
}

export function HistorialActions({
  colegioId,
  calendarioId,
  estado,
}: HistorialActionsProps) {
  const [loading, setLoading] = useState(false);

  async function descargarExcel() {
    setLoading(true);
    try {
      const response = await fetch(`/api/calendarios/${calendarioId}/generar`, {
        method: "POST",
      });
      if (!response.ok) {
        alert("No s'ha pogut generar l'Excel");
        return;
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? "Calendari.xlsx";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {estado === "borrador" && (
        <Link
          href={`/colegios/${colegioId}/nuevo-curso?editar=${calendarioId}`}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Continuar edició
        </Link>
      )}
      <button
        type="button"
        onClick={descargarExcel}
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "Generant…" : "Descarregar Excel"}
      </button>
    </div>
  );
}
