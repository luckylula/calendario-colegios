import type { TipoEvento, TipoPersonal } from "@/generated/client";

export interface EventoFormInput {
  tipo: TipoEvento;
  nombre: string;
  fechaInicio: string;
  fechaFin: string | null;
}

export interface CalendarioFormData {
  curso: string;
  inicioCurso: string;
  finCurso: string;
  tipoPersonal: TipoPersonal;
  horasSemanales: number;
  creadoViaIa: boolean;
  eventos: EventoFormInput[];
}

export interface CalendarioPayload extends CalendarioFormData {
  colegioId: string;
  estado?: "borrador" | "confirmado";
}

import {
  fechaPorDefectoFinCurso,
  fechaPorDefectoInicioCurso,
  horasSemanalesPorTipo,
} from "@/lib/constants";

export function createEmptyCalendarioForm(curso?: string): CalendarioFormData {
  const opciones = curso ?? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  return {
    curso: opciones,
    inicioCurso: fechaPorDefectoInicioCurso(opciones),
    finCurso: fechaPorDefectoFinCurso(opciones),
    tipoPersonal: "monitor",
    horasSemanales: horasSemanalesPorTipo("monitor"),
    creadoViaIa: false,
    eventos: [],
  };
}

export function createEmptyEvento(tipo: TipoEvento, nombre = ""): EventoFormInput {
  return {
    tipo,
    nombre,
    fechaInicio: "",
    fechaFin: "",
  };
}
