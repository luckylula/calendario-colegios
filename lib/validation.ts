import type { EventoFormInput } from "@/lib/types";
import {
  TIPO_EVENTO_LABELS,
  parseDateInput,
  parseHorasSemanales,
  requiereRangoFechas,
} from "@/lib/constants";

function eventoLabel(evento: EventoFormInput): string {
  return evento.nombre?.trim() || TIPO_EVENTO_LABELS[evento.tipo];
}

export function resolveEventoNombre(evento: EventoFormInput): string {
  const nombre = evento.nombre?.trim();
  if (nombre) return nombre;
  return TIPO_EVENTO_LABELS[evento.tipo];
}

export function validateCalendarioPayload(body: {
  colegioId?: string;
  curso?: string;
  inicioCurso?: string;
  finCurso?: string;
  tipoPersonal?: string;
  horasSemanales?: number;
  eventos?: EventoFormInput[];
}): string | null {
  if (!body.colegioId?.trim()) return "Falta el colegio";
  if (!body.curso?.trim()) return "Falta el curs escolar";
  if (!body.inicioCurso) return "Falta la data d'inici de curs";
  if (!body.finCurso) return "Falta la data de fi de curs";

  if (!body.tipoPersonal) return "Falta el tipus de personal";
  if (body.tipoPersonal !== "monitor" && body.tipoPersonal !== "coordinador") {
    return "Tipus de personal no vàlid";
  }

  const horas = parseHorasSemanales(body.horasSemanales, 0);
  if (!Number.isFinite(horas) || horas <= 0 || horas > 40) {
    return "Les hores setmanals han de ser entre 0,01 i 40";
  }

  const inicio = parseDateInput(body.inicioCurso);
  const fin = parseDateInput(body.finCurso);
  if (inicio > fin) return "La data d'inici no pot ser posterior a la de fi";

  if (!Array.isArray(body.eventos)) return "Els esdeveniments han de ser una llista";

  for (const evento of body.eventos) {
    if (!evento.fechaInicio) continue;

    const label = eventoLabel(evento);
    const tieneNombre = Boolean(evento.nombre?.trim());

    if (requiereRangoFechas(evento.tipo, tieneNombre) && !evento.fechaFin) {
      return `Falta la data de fi per a "${label}"`;
    }

    const evInicio = parseDateInput(evento.fechaInicio);
    const evFin = evento.fechaFin ? parseDateInput(evento.fechaFin) : evInicio;
    if (evInicio > evFin) {
      return `Dates invàlides per a "${label}"`;
    }
  }

  return null;
}

export function sanitizeEventos(eventos: EventoFormInput[]) {
  return eventos
    .filter((e) => e.fechaInicio)
    .map((e) => {
      const hasCustomName = Boolean(e.nombre?.trim());
      const fechaInicio = parseDateInput(e.fechaInicio);
      const necesitaRango = requiereRangoFechas(e.tipo, hasCustomName);
      const fechaFin = necesitaRango
        ? e.fechaFin
          ? parseDateInput(e.fechaFin)
          : null
        : hasCustomName && e.fechaFin
          ? parseDateInput(e.fechaFin)
          : null;

      return {
        tipo: e.tipo,
        nombre: resolveEventoNombre(e),
        fechaInicio,
        fechaFin,
      };
    });
}

export function isEventoUnDia(evento: { fechaInicio: Date; fechaFin: Date | null }): boolean {
  if (!evento.fechaFin) return true;
  return evento.fechaInicio.getTime() === evento.fechaFin.getTime();
}

