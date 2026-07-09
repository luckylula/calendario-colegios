import type { TipoEvento } from "@/generated/client";
import type { EventoCalendario } from "@/generated/client";

/** Colors from CALENDARI LABORAL ABRERA template */
export const PLANTILLA_COLORS = {
  titleBg: "FFD9E2F3",
  monthHeaderBg: "FFD8D8D8",
  weekdayHeaderBg: "FFE0ECFF",
  weekLabelBg: "FFE9E9E9",
  border: "FFBFBFBF",
  inicioFinCurso: "FF92D050",
  festivoOficial: "FFFF0000",
  festivoLocal: "FFFFC000",
  festivoLliure: "FFFFFF00",
  vacaciones: "FFBDD7EE",
  outsideCourse: "FFF2F2F2",
  jornada: "FFE2EFDA",
  weekendBg: "FFFFF2CC",
  weekendHeaderBg: "FFFFE699",
  computFixedBg: "FFF5F9FF",
  borderStrong: "FF000000",
} as const;

export const TIPO_TO_PLANTILLA_COLOR: Record<TipoEvento, string> = {
  festivo_oficial: PLANTILLA_COLORS.festivoOficial,
  festivo_local: PLANTILLA_COLORS.festivoLocal,
  festivo_lliure_disposicio: PLANTILLA_COLORS.festivoLliure,
  vacaciones: PLANTILLA_COLORS.vacaciones,
  jornada_intensiva: PLANTILLA_COLORS.jornada,
  jornada_continuada: PLANTILLA_COLORS.jornada,
};

export const LEGEND_ITEMS = [
  { key: "festivo_lliure_disposicio" as const, label: "dies de lliure disposició" },
  { key: "festivo_local" as const, label: "festa local" },
  { key: "festivo_oficial" as const, label: "festa estatal" },
  { key: "inicio_fin" as const, label: "inici i fi de curs escolar" },
];

export const MONTH_NAMES_CA = [
  "Gener",
  "Febrer",
  "Març",
  "Abril",
  "Maig",
  "Juny",
  "Juliol",
  "Agost",
  "Setembre",
  "Octubre",
  "Novembre",
  "Desembre",
];

export const WEEKDAYS_CA = ["Dl", "Dm", "Dx", "Dj", "Dv", "Ds", "Dg"];

export function isWeekendDayIndex(dayIndex: number): boolean {
  return dayIndex >= 5;
}

export const COLS_PER_MONTH = 9;
export const GAP_COLS_BETWEEN_MONTHS = 2;
export const GRID_LEADING_GAP_COLS = 2;
export const MONTHS_PER_ROW = 3;

export function monthBlockStartCol(blockIndex: number): number {
  return (
    GRID_LEADING_GAP_COLS +
    blockIndex * (COLS_PER_MONTH + GAP_COLS_BETWEEN_MONTHS) +
    1
  );
}

export function colForMonthBlock(
  monthIndexInRow: number,
  offsetInBlock: number
): number {
  return monthBlockStartCol(monthIndexInRow) + offsetInBlock;
}

export function gridTotalCols(): number {
  return (
    GRID_LEADING_GAP_COLS +
    MONTHS_PER_ROW * COLS_PER_MONTH +
    (MONTHS_PER_ROW - 1) * GAP_COLS_BETWEEN_MONTHS
  );
}

export function leadingGapCols(): number[] {
  return Array.from({ length: GRID_LEADING_GAP_COLS }, (_, i) => i + 1);
}

export function monthGapCols(blockIndex: number): number[] {
  if (blockIndex >= MONTHS_PER_ROW - 1) return [];
  const gapStart = monthBlockStartCol(blockIndex) + COLS_PER_MONTH;
  return [gapStart, gapStart + 1];
}

/** Bottom section aligned under calendar blocks */
export const LEGEND_COLOR_COL = monthBlockStartCol(0);
export const LEGEND_LABEL_START = LEGEND_COLOR_COL + 1;
export const LEGEND_LABEL_END = LEGEND_COLOR_COL + 7;
export const LEGEND_COUNT_COL = LEGEND_COLOR_COL + 8;

export const COMPUT_LABEL_COL = monthBlockStartCol(1);
export const COMPUT_LABEL_END = COMPUT_LABEL_COL + 4;
export const COMPUT_VALUE_COL = COMPUT_LABEL_COL + 5;
export const COMPUT_VACANCE_LABEL_COL = COMPUT_LABEL_COL + 6;
export const COMPUT_VACANCE_VALUE_COL = COMPUT_LABEL_COL + 8;
export const COMPUT_BLOCK_END_COL = COMPUT_VACANCE_VALUE_COL;

export const MONTH_SUMMARY_NAME_COL = monthBlockStartCol(2);
export const MONTH_SUMMARY_COUNT_COL = MONTH_SUMMARY_NAME_COL + 1;

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES_CA[month]} ${year}`;
}

export function eachDayInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(start);
  current.setUTCHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setUTCHours(0, 0, 0, 0);
  while (current <= last) {
    days.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return days;
}

export function buildDayEventMap(
  eventos: EventoCalendario[]
): Map<string, EventoCalendario> {
  const map = new Map<string, EventoCalendario>();
  for (const evento of eventos) {
    const fin = evento.fechaFin ?? evento.fechaInicio;
    for (const day of eachDayInRange(evento.fechaInicio, fin)) {
      const key = day.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, evento);
    }
  }
  return map;
}

export function getMonthsInRange(
  start: Date,
  end: Date
): { year: number; month: number }[] {
  const months: { year: number; month: number }[] = [];
  const current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (current <= last) {
    months.push({ year: current.getUTCFullYear(), month: current.getUTCMonth() });
    current.setUTCMonth(current.getUTCMonth() + 1);
  }
  return months;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isWeekday(date: Date): boolean {
  const d = date.getUTCDay();
  return d >= 1 && d <= 5;
}

function isWithinCourse(date: Date, inicio: Date, fin: Date): boolean {
  const t = date.getTime();
  return t >= inicio.getTime() && t <= fin.getTime();
}

const NON_LECTIVE = new Set<TipoEvento>([
  "vacaciones",
  "festivo_oficial",
  "festivo_lliure_disposicio",
  "festivo_local",
]);

export function isLectiveDay(
  date: Date,
  inicioCurso: Date,
  finCurso: Date,
  dayEventMap: Map<string, EventoCalendario>
): boolean {
  if (!isWeekday(date)) return false;
  if (!isWithinCourse(date, inicioCurso, finCurso)) return false;
  const evento = dayEventMap.get(dateKey(date));
  if (evento && NON_LECTIVE.has(evento.tipo)) return false;
  return true;
}

export function getCellColor(
  date: Date,
  inicioCurso: Date,
  finCurso: Date,
  dayEventMap: Map<string, EventoCalendario>
): string | null {
  const key = dateKey(date);
  if (key === dateKey(inicioCurso) || key === dateKey(finCurso)) {
    return PLANTILLA_COLORS.inicioFinCurso;
  }
  const evento = dayEventMap.get(key);
  if (evento) return TIPO_TO_PLANTILLA_COLOR[evento.tipo];
  if (!isWithinCourse(date, inicioCurso, finCurso)) {
    return PLANTILLA_COLORS.outsideCourse;
  }
  return null;
}

export interface WeekRowData {
  weekLectiveDays: number;
  days: (null | { date: Date; dayNum: number; inMonth: boolean })[];
}

export function buildWeekRowsForMonth(
  year: number,
  month: number,
  inicioCurso: Date,
  finCurso: Date,
  dayEventMap: Map<string, EventoCalendario>
): WeekRowData[] {
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0));

  const firstMonday = new Date(monthStart);
  const startDow = (firstMonday.getUTCDay() + 6) % 7;
  firstMonday.setUTCDate(firstMonday.getUTCDate() - startDow);

  const weeks: WeekRowData[] = [];
  let cursor = new Date(firstMonday);

  while (cursor <= monthEnd) {
    const days: WeekRowData["days"] = [];
    let weekLective = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(cursor);
      date.setUTCDate(cursor.getUTCDate() + i);
      const inMonth =
        date.getUTCMonth() === month && date.getUTCFullYear() === year;

      if (inMonth) {
        if (isLectiveDay(date, inicioCurso, finCurso, dayEventMap)) {
          weekLective++;
        }
        days.push({ date, dayNum: date.getUTCDate(), inMonth: true });
      } else {
        days.push(null);
      }
    }

    const hasMonthDay = days.some((d) => d?.inMonth);
    if (hasMonthDay) {
      weeks.push({ weekLectiveDays: weekLective, days });
    }

    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  return weeks;
}

export function countEventDaysByType(
  eventos: EventoCalendario[],
  tipos: TipoEvento[]
): number {
  let total = 0;
  for (const evento of eventos) {
    if (!tipos.includes(evento.tipo)) continue;
    const fin = evento.fechaFin ?? evento.fechaInicio;
    for (const day of eachDayInRange(evento.fechaInicio, fin)) {
      if (isWeekday(day)) total++;
    }
  }
  return total;
}

export function chunkMonths<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** School year order: Setembre → Juliol */
const SCHOOL_YEAR_MONTH_ORDER = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6];

export function sortSchoolYearMonths(
  months: { year: number; month: number }[]
): { year: number; month: number }[] {
  return [...months].sort((a, b) => {
    const orderA = SCHOOL_YEAR_MONTH_ORDER.indexOf(a.month);
    const orderB = SCHOOL_YEAR_MONTH_ORDER.indexOf(b.month);
    if (orderA !== orderB) return orderA - orderB;
    return a.year - b.year;
  });
}

export function monthNameUpper(month: number): string {
  return MONTH_NAMES_CA[month].toUpperCase();
}

export function countLectiveDaysForMonth(
  year: number,
  month: number,
  inicioCurso: Date,
  finCurso: Date,
  dayEventMap: Map<string, EventoCalendario>
): number {
  const weeks = buildWeekRowsForMonth(
    year,
    month,
    inicioCurso,
    finCurso,
    dayEventMap
  );
  return weeks.reduce((sum, week) => sum + week.weekLectiveDays, 0);
}

export interface MonthLectiveSummary {
  year: number;
  month: number;
  label: string;
  lectiveDays: number;
}

export function buildMonthLectiveSummaries(
  months: { year: number; month: number }[],
  inicioCurso: Date,
  finCurso: Date,
  dayEventMap: Map<string, EventoCalendario>
): MonthLectiveSummary[] {
  return sortSchoolYearMonths(months).map(({ year, month }) => ({
    year,
    month,
    label: monthNameUpper(month),
    lectiveDays: countLectiveDaysForMonth(
      year,
      month,
      inicioCurso,
      finCurso,
      dayEventMap
    ),
  }));
}

export function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

export function hoursPerLectiveDay(horasSemanales: number): number {
  return horasSemanales / 5;
}

export function weekHoursFromLectiveDays(
  lectiveDays: number,
  horasSemanales: number
): number {
  return roundHours(lectiveDays * hoursPerLectiveDay(horasSemanales));
}

export interface ComputHoresResult {
  horesConveni: number;
  diesAnuals: number;
  diesVacancesConveni: number;
  diesTotalsMenjadors: number;
  vacancesCalendar: number;
  horesMenjadorCalendariEscolar: number;
  horesMenjadorSegonsJornada: number;
  computHores: number;
  diferenciaHores: number;
}

export function buildComputHores(params: {
  horasSemanales: number;
  totalLectiveDays: number;
  vacancesCalendar: number;
  computHores: number;
  horesConveni?: number;
  diesAnuals?: number;
  diesVacancesConveni?: number;
  jornadaReferencia?: number;
}): ComputHoresResult {
  const horesConveni = params.horesConveni ?? 1695;
  const diesAnuals = params.diesAnuals ?? 365;
  const diesVacancesConveni = params.diesVacancesConveni ?? 30;
  const jornadaReferencia = params.jornadaReferencia ?? 37.5;

  const horesMenjadorCalendariEscolar = roundHours(
    (params.totalLectiveDays * horesConveni) / diesAnuals
  );
  const horesMenjadorSegonsJornada = roundHours(
    (horesMenjadorCalendariEscolar * params.horasSemanales) / jornadaReferencia
  );
  const diferenciaHores = roundHours(
    params.computHores - horesMenjadorSegonsJornada
  );

  return {
    horesConveni,
    diesAnuals,
    diesVacancesConveni,
    diesTotalsMenjadors: params.totalLectiveDays,
    vacancesCalendar: params.vacancesCalendar,
    horesMenjadorCalendariEscolar,
    horesMenjadorSegonsJornada,
    computHores: roundHours(params.computHores),
    diferenciaHores,
  };
}
