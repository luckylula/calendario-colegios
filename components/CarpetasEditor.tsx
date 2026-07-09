"use client";

import { useState } from "react";
import Link from "next/link";
import { isFolderIdConfigured } from "@/lib/folder-id";

interface ColegioCarpetas {
  id: string;
  nombre: string;
  googleDriveFolderId: string;
  onedriveFolderId: string;
  googleDriveOutputFolderId: string | null;
}

interface CarpetasEditorProps {
  colegios: ColegioCarpetas[];
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
      }`}
    >
      {ok ? "Configurat" : "Pendent"}
    </span>
  );
}

export function CarpetasEditor({ colegios: initial }: CarpetasEditorProps) {
  const [colegios, setColegios] = useState(initial);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const configurados = colegios.filter(
    (c) =>
      isFolderIdConfigured(c.googleDriveFolderId) &&
      isFolderIdConfigured(c.onedriveFolderId)
  ).length;

  function updateField(
    id: string,
    field: keyof Pick<
      ColegioCarpetas,
      "googleDriveFolderId" | "onedriveFolderId" | "googleDriveOutputFolderId"
    >,
    value: string
  ) {
    setColegios((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }

  async function saveColegio(colegio: ColegioCarpetas) {
    setSavingId(colegio.id);
    setMessage(null);

    const response = await fetch(`/api/colegios/${colegio.id}/carpetas`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        googleDriveFolderId: colegio.googleDriveFolderId,
        onedriveFolderId: colegio.onedriveFolderId,
        googleDriveOutputFolderId: colegio.googleDriveOutputFolderId,
      }),
    });

    const data = await response.json();
    setSavingId(null);

    if (!response.ok) {
      setMessage(data.error ?? "Error en guardar");
      return;
    }

    setColegios((prev) => prev.map((c) => (c.id === colegio.id ? data : c)));
    setMessage(`Guardat: ${colegio.nombre}`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p>
          <strong>{configurados}</strong> de <strong>{colegios.length}</strong>{" "}
          centres amb carpetes configurades.
        </p>
        <p className="mt-1">
          Pots enganxar l&apos;ID o la URL completa de la carpeta. Es normalitza
          automàticament.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <div className="space-y-4">
        {colegios.map((colegio) => {
          const ok =
            isFolderIdConfigured(colegio.googleDriveFolderId) &&
            isFolderIdConfigured(colegio.onedriveFolderId);

          return (
            <article
              key={colegio.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{colegio.nombre}</h2>
                <StatusBadge ok={ok} />
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Google Drive — origen (PDF calendari)
                  </label>
                  <input
                    type="text"
                    value={colegio.googleDriveFolderId}
                    onChange={(e) =>
                      updateField(colegio.id, "googleDriveFolderId", e.target.value)
                    }
                    placeholder="ID o URL de la carpeta"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    OneDrive — destí (oficina)
                  </label>
                  <input
                    type="text"
                    value={colegio.onedriveFolderId}
                    onChange={(e) =>
                      updateField(colegio.id, "onedriveFolderId", e.target.value)
                    }
                    placeholder="ID o URL de la carpeta"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Google Drive — destí sortida (opcional)
                  </label>
                  <input
                    type="text"
                    value={colegio.googleDriveOutputFolderId ?? ""}
                    onChange={(e) =>
                      updateField(
                        colegio.id,
                        "googleDriveOutputFolderId",
                        e.target.value
                      )
                    }
                    placeholder="Buit = mateixa carpeta origen"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => saveColegio(colegio)}
                disabled={savingId === colegio.id}
                className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {savingId === colegio.id ? "Guardant…" : "Guardar"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function CarpetasPageHeader() {
  return (
    <div className="mb-8">
      <Link
        href="/colegios"
        className="mb-4 inline-flex text-sm text-slate-500 hover:text-emerald-700"
      >
        ← Tornar als centres
      </Link>
      <h1 className="text-3xl font-semibold text-slate-900">Carpetes Drive / OneDrive</h1>
      <p className="mt-2 text-slate-600">
        Configura els IDs de carpeta per a cada centre. Necessari abans d&apos;activar la
        subida automàtica (Fase 2).
      </p>
    </div>
  );
}
