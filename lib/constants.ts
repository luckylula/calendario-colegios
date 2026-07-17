import type { TipoEvento, TipoPersonal } from "@/generated/client";

export const TIPOS_EVENTO: TipoEvento[] = [
  "vacaciones",
  "festivo_oficial",
  "festivo_lliure_disposicio",
  "jornada_intensiva",
  "jornada_continuada",
  "festivo_local",
];

export const TIPO_EVENTO_LABELS: Record<TipoEvento, string> = {
  vacaciones: "Vacances",
  festivo_oficial: "Festiu oficial",
  festivo_lliure_disposicio: "Festiu de lliure disposició",
  jornada_intensiva: "Jornada intensiva",
  jornada_continuada: "Jornada continuada",
  festivo_local: "Festiu local",
};

export const TIPO_EVENTO_COLORS: Record<TipoEvento, string> = {
  vacaciones: "FF3B82F6",
  festivo_oficial: "FFEF4444",
  festivo_lliure_disposicio: "FFF97316",
  jornada_intensiva: "FFEAB308",
  jornada_continuada: "FF22C55E",
  festivo_local: "FFA855F7",
};

export const VACACIONES_PREDEFINIDAS = [
  { nombre: "Nadal", tipo: "vacaciones" as const },
  { nombre: "Setmana Santa", tipo: "vacaciones" as const },
] as const;

export const TIPOS_PERSONAL: TipoPersonal[] = ["monitor", "coordinador"];

export const TIPO_PERSONAL_LABELS: Record<TipoPersonal, string> = {
  monitor: "Monitor/a",
  coordinador: "Coordinador/a",
};

export const HORES_SETMANALS_PREDEFINIDES = [13, 13.75, 37, 37.5] as const;

export const HORES_CONVENI_ANUALS = 1695;
export const DIES_ANUALS = 365;
export const DIES_VACANCES_CONVENI = 30;
export const JORNADA_REFERENCIA_HORES = 37.5;

export function horasSemanalesPorTipo(tipo: TipoPersonal): number {
  return tipo === "coordinador" ? 37.5 : 13;
}

export function parseHorasSemanales(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 100) / 100;
  }
  const parsed = parseFloat(String(value ?? "").replace(",", "."));
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.round(parsed * 100) / 100;
  }
  return fallback;
}

export function formatHoresLabel(horas: number): string {
  const rounded = Math.round(horas * 100) / 100;
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
}

export function formatHoresPerDia(horasSemanales: number): string {
  return formatHoresLabel(horasSemanales / 5);
}

/** Solo vacaciones (Nadal, Setmana Santa…) exigen inicio + fin. El resto: fin opcional. */
export function requiereRangoFechas(tipo: TipoEvento, _tieneNombre = false): boolean {
  return tipo === "vacaciones";
}

export function esFestivoUnDia(tipo: TipoEvento, tieneNombre = false): boolean {
  return !requiereRangoFechas(tipo, tieneNombre);
}

export function generarOpcionesCurso(cantidad = 5): string[] {
  const añoActual = new Date().getFullYear();
  const opciones: string[] = [];
  for (let i = -1; i < cantidad - 1; i++) {
    const inicio = añoActual + i;
    opciones.push(`${inicio}-${inicio + 1}`);
  }
  return opciones;
}

export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatDateDisplay(date: Date): string {
  return new Intl.DateTimeFormat("ca-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
