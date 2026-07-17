"use client";

import { useState } from "react";
import type { TipoEvento, TipoPersonal } from "@/generated/client";
import {
  TIPO_EVENTO_LABELS,
  TIPOS_EVENTO,
  TIPO_PERSONAL_LABELS,
  TIPOS_PERSONAL,
  VACACIONES_PREDEFINIDAS,
  HORES_SETMANALS_PREDEFINIDES,
  generarOpcionesCurso,
  formatHoresPerDia,
  horasSemanalesPorTipo,
  parseHorasSemanales,
  requiereRangoFechas,
} from "@/lib/constants";
import {
  createEmptyCalendarioForm,
  createEmptyEvento,
  type CalendarioFormData,
  type EventoFormInput,
} from "@/lib/types";

interface CalendarioFormProps {
  colegioId: string;
  colegioNombre: string;
  initialData?: CalendarioFormData;
  calendarioId?: string;
  onSaved?: (id: string) => void;
}

function EventoRow({
  evento,
  onChange,
  onRemove,
  showTipo = true,
  allowRango = true,
}: {
  evento: EventoFormInput;
  onChange: (evento: EventoFormInput) => void;
  onRemove?: () => void;
  showTipo?: boolean;
  allowRango?: boolean;
}) {
  const fiObligatori = requiereRangoFechas(evento.tipo);
  const mostrarFi = allowRango;

  return (
    <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-12">
      {showTipo && (
        <div className="sm:col-span-3">
          <label className="mb-1 block text-xs font-medium text-slate-500">Tipus</label>
          <select
            value={evento.tipo}
            onChange={(e) =>
              onChange({ ...evento, tipo: e.target.value as TipoEvento })
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {TIPOS_EVENTO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {TIPO_EVENTO_LABELS[tipo]}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className={showTipo ? "sm:col-span-3" : "sm:col-span-4"}>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Nom <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        <input
          type="text"
          value={evento.nombre}
          onChange={(e) => onChange({ ...evento, nombre: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder={TIPO_EVENTO_LABELS[evento.tipo]}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-500">Inici</label>
        <input
          type="date"
          value={evento.fechaInicio}
          onChange={(e) => onChange({ ...evento, fechaInicio: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          required={fiObligatori}
        />
      </div>
      {mostrarFi && (
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Fi
            {fiObligatori ? (
              ""
            ) : (
              <span className="font-normal text-slate-400"> (opcional)</span>
            )}
          </label>
          <input
            type="date"
            value={evento.fechaFin ?? ""}
            onChange={(e) =>
              onChange({ ...evento, fechaFin: e.target.value || null })
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required={fiObligatori}
          />
        </div>
      )}
      {onRemove && (
        <div className="flex items-end sm:col-span-2">
          <button
            type="button"
            onClick={onRemove}
            className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

function findVacacion(eventos: EventoFormInput[], nombre: string) {
  return eventos.find((e) => e.tipo === "vacaciones" && e.nombre === nombre);
}

export function CalendarioForm({
  colegioId,
  colegioNombre,
  initialData,
  calendarioId,
  onSaved,
}: CalendarioFormProps) {
  const [form, setForm] = useState<CalendarioFormData>(
    initialData ?? createEmptyCalendarioForm(generarOpcionesCurso()[1])
  );
  const [savedId, setSavedId] = useState<string | undefined>(calendarioId);
  const [loading, setLoading] = useState<"save" | "generate" | "autofill" | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(
    null
  );

  const otrosEventos = form.eventos.filter(
    (e) =>
      !(
        e.tipo === "vacaciones" &&
        VACACIONES_PREDEFINIDAS.some((v) => v.nombre === e.nombre)
      )
  );

  function updateVacacion(nombre: string, partial: Partial<EventoFormInput>) {
    setForm((prev) => {
      const existing = findVacacion(prev.eventos, nombre);
      const rest = prev.eventos.filter(
        (e) => !(e.tipo === "vacaciones" && e.nombre === nombre)
      );
      const updated: EventoFormInput = existing
        ? { ...existing, ...partial }
        : { ...createEmptyEvento("vacaciones", nombre), ...partial };

      const hasData = updated.fechaInicio || updated.fechaFin;
      return {
        ...prev,
        eventos: hasData ? [...rest, updated] : rest,
      };
    });
  }

  function addEvento(tipo: TipoEvento) {
    setForm((prev) => ({
      ...prev,
      eventos: [...prev.eventos, createEmptyEvento(tipo)],
    }));
  }

  function updateOtroEvento(index: number, evento: EventoFormInput) {
    setForm((prev) => {
      const vacaciones = prev.eventos.filter(
        (e) =>
          e.tipo === "vacaciones" &&
          VACACIONES_PREDEFINIDAS.some((v) => v.nombre === e.nombre)
      );
      const nuevosOtros = [...otrosEventos];
      nuevosOtros[index] = evento;
      return { ...prev, eventos: [...vacaciones, ...nuevosOtros] };
    });
  }

  function removeOtroEvento(index: number) {
    setForm((prev) => {
      const vacaciones = prev.eventos.filter(
        (e) =>
          e.tipo === "vacaciones" &&
          VACACIONES_PREDEFINIDAS.some((v) => v.nombre === e.nombre)
      );
      const nuevosOtros = otrosEventos.filter((_, i) => i !== index);
      return { ...prev, eventos: [...vacaciones, ...nuevosOtros] };
    });
  }

  async function parseJsonResponse(response: Response): Promise<{ id?: string; error?: string }> {
    const contentType = response.headers.get("Content-Type") ?? "";
    if (!contentType.includes("application/json")) {
      return {};
    }
    return response.json();
  }

  async function save(estado: "borrador" | "confirmado") {
    setLoading(estado === "borrador" ? "save" : "generate");
    setMessage(null);

    try {
      const response = await fetch("/api/calendarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: savedId,
          colegioId,
          ...form,
          horasSemanales: parseHorasSemanales(
            form.horasSemanales,
            horasSemanalesPorTipo(form.tipoPersonal)
          ),
          estado: "borrador",
        }),
      });

      const data = await parseJsonResponse(response);
      if (!response.ok) {
        setMessage({ type: "error", text: data.error ?? "Error en guardar" });
        return;
      }

      if (!data.id) {
        setMessage({ type: "error", text: "Resposta invàlida del servidor" });
        return;
      }

      setSavedId(data.id);
      onSaved?.(data.id);

      if (estado === "borrador") {
        setMessage({ type: "ok", text: "Esborrany guardat correctament" });
        return;
      }

      const genResponse = await fetch(`/api/calendarios/${data.id}/generar`, {
        method: "POST",
      });

      if (!genResponse.ok) {
        const err = await parseJsonResponse(genResponse);
        setMessage({
          type: "error",
          text: err.error ?? "Error en generar el calendari",
        });
        return;
      }

      const blob = await genResponse.blob();
      const disposition = genResponse.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? `Calendari_${colegioNombre}.xlsx`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      const n8nStatus = genResponse.headers.get("X-N8N-Status");

      setMessage({
        type: "ok",
        text:
          n8nStatus === "ok"
            ? "Calendari generat i pujat a Drive/OneDrive"
            : "Calendari generat i descarregat correctament",
      });
    } catch {
      setMessage({
        type: "error",
        text: "Error de connexió. Comprova la xarxa i torna-ho a provar.",
      });
    } finally {
      setLoading(null);
    }
  }

  async function autocompletar() {
    setLoading("autofill");
    setMessage(null);

    const response = await fetch(`/api/colegios/${colegioId}/autocompletar`, {
      method: "POST",
    });
    const data = await response.json();

    setLoading(null);
    if (!response.ok) {
      setMessage({
        type: "error",
        text: data.error ?? "No s'ha pogut autocompletar des del PDF",
      });
      return;
    }

    setForm({
      ...form,
      curso: data.curso ?? form.curso,
      inicioCurso: data.inicioCurso ?? data.inicio_curso ?? form.inicioCurso,
      finCurso: data.finCurso ?? data.fin_curso ?? form.finCurso,
      creadoViaIa: true,
      eventos: (data.eventos ?? []).map((e: EventoFormInput & { fecha_fin?: string; fecha_inicio?: string }) => ({
        tipo: e.tipo,
        nombre: e.nombre,
        fechaInicio: e.fechaInicio ?? e.fecha_inicio ?? "",
        fechaFin: e.fechaFin ?? e.fecha_fin ?? null,
      })),
    });
    setMessage({
      type: "ok",
      text: "Dades precarregades des del PDF. Revisa abans de guardar.",
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{colegioNombre}</h1>
            <p className="mt-1 text-sm text-slate-500">Nou calendari de curs escolar</p>
          </div>
          <button
            type="button"
            onClick={autocompletar}
            disabled={loading !== null}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
          >
            {loading === "autofill" ? "Llegint PDF…" : "Autocompletar des del PDF"}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Curs escolar
            </label>
            <select
              value={form.curso}
              onChange={(e) => setForm((prev) => ({ ...prev, curso: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {generarOpcionesCurso().map((curso) => (
                <option key={curso} value={curso}>
                  {curso}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Inici de curs
            </label>
            <input
              type="date"
              value={form.inicioCurso}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, inicioCurso: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Fi de curs
            </label>
            <input
              type="date"
              value={form.finCurso}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, finCurso: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Vacances</h2>
        <p className="mb-3 text-sm text-slate-500">
          Nadal i Setmana Santa: cal indicar data d&apos;inici i de fi.
        </p>
        <div className="space-y-3">
          {VACACIONES_PREDEFINIDAS.map(({ nombre }) => {
            const evento =
              findVacacion(form.eventos, nombre) ??
              createEmptyEvento("vacaciones", nombre);
            return (
              <EventoRow
                key={nombre}
                evento={evento}
                showTipo={false}
                onChange={(e) => updateVacacion(nombre, e)}
              />
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Altres esdeveniments</h2>
          <div className="flex flex-wrap gap-2">
            {(
              [
                "festivo_oficial",
                "festivo_lliure_disposicio",
                "jornada_intensiva",
                "jornada_continuada",
                "festivo_local",
              ] as TipoEvento[]
            ).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => addEvento(tipo)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                + {TIPO_EVENTO_LABELS[tipo]}
              </button>
            ))}
          </div>
        </div>

        {otrosEventos.length === 0 ? (
          <p className="text-sm text-slate-500">
            Inici obligatori. Fi i nom opcionals (si no hi ha fi, compta com un sol dia).
          </p>
        ) : (
          <div className="space-y-3">
            {otrosEventos.map((evento, index) => (
              <EventoRow
                key={`${evento.tipo}-${index}`}
                evento={evento}
                onChange={(e) => updateOtroEvento(index, e)}
                onRemove={() => removeOtroEvento(index)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Personal del menjador</h2>
        <p className="mb-4 text-sm text-slate-500">
          Indica si el calendari és per a monitor/a o coordinador/a i les hores setmanals
          de la jornada. Pots escriure qualsevol valor (13, 13,75, 37, 37,5…).
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tipus de personal
            </label>
            <select
              value={form.tipoPersonal}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tipoPersonal: e.target.value as TipoPersonal,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {TIPOS_PERSONAL.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {TIPO_PERSONAL_LABELS[tipo]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Hores setmanals <span className="font-normal text-slate-400">(qualsevol valor)</span>
            </label>
            <div className="space-y-2">
              <input
                type="number"
                min={0.25}
                max={40}
                step="any"
                value={form.horasSemanales || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    setForm((prev) => ({ ...prev, horasSemanales: 0 }));
                    return;
                  }
                  const parsed = parseFloat(value.replace(",", "."));
                  if (!Number.isNaN(parsed)) {
                    setForm((prev) => ({ ...prev, horasSemanales: parsed }));
                  }
                }}
                placeholder="Ex: 13,75"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-1">
                {HORES_SETMANALS_PREDEFINIDES.map((horas) => (
                  <button
                    key={horas}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, horasSemanales: horas }))
                    }
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                      form.horasSemanales === horas
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {String(horas).replace(".", ",")} h
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Hores per dia lectiu:{" "}
              {form.horasSemanales > 0
                ? `${formatHoresPerDia(form.horasSemanales)} h`
                : "—"}{" "}
              (hores setmanals ÷ 5 dies)
            </p>
          </div>
        </div>
      </section>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "ok"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => save("borrador")}
          disabled={loading !== null}
          className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading === "save" ? "Guardant…" : "Guardar esborrany"}
        </button>
        <button
          type="button"
          onClick={() => save("confirmado")}
          disabled={loading !== null}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading === "generate"
            ? "Generant…"
            : "Confirmar i generar calendari"}
        </button>
      </div>
    </div>
  );
}