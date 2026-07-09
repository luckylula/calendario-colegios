import ExcelJS from "exceljs";
import type { CalendarioCurso, Colegio, EventoCalendario } from "@/generated/client";
import {
  DIES_ANUALS,
  DIES_VACANCES_CONVENI,
  HORES_CONVENI_ANUALS,
  JORNADA_REFERENCIA_HORES,
  formatDateDisplay,
  formatHoresLabel,
  formatHoresPerDia,
} from "@/lib/constants";
import {
  COLS_PER_MONTH,
  COMPUT_LABEL_COL,
  COMPUT_LABEL_END,
  COMPUT_VALUE_COL,
  COMPUT_VACANCE_LABEL_COL,
  COMPUT_VACANCE_VALUE_COL,
  COMPUT_BLOCK_END_COL,
  GAP_COLS_BETWEEN_MONTHS,
  GRID_LEADING_GAP_COLS,
  LEGEND_COLOR_COL,
  LEGEND_COUNT_COL,
  LEGEND_ITEMS,
  LEGEND_LABEL_END,
  LEGEND_LABEL_START,
  MONTHS_PER_ROW,
  MONTH_SUMMARY_NAME_COL,
  PLANTILLA_COLORS,
  TIPO_TO_PLANTILLA_COLOR,
  WEEKDAYS_CA,
  buildComputHores,
  buildDayEventMap,
  buildMonthLectiveSummaries,
  buildWeekRowsForMonth,
  chunkMonths,
  colForMonthBlock,
  countEventDaysByType,
  getCellColor,
  getMonthsInRange,
  gridTotalCols,
  isWeekendDayIndex,
  leadingGapCols,
  monthGapCols,
  monthLabel,
  weekHoursFromLectiveDays,
} from "@/lib/excel/plantilla-laboral";

type CalendarioConRelaciones = CalendarioCurso & {
  colegio: Colegio;
  eventos: EventoCalendario[];
};

interface MonthBlockResult {
  endRow: number;
  monthHours: number;
}

function clearGapColumns(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number
) {
  const gapCols = [
    ...leadingGapCols(),
    ...monthGapCols(0),
    ...monthGapCols(1),
  ];

  for (const gapCol of gapCols) {
    for (let row = startRow; row <= endRow; row++) {
      const cell = sheet.getCell(row, gapCol);
      cell.value = null;
      cell.border = {};
    }
    sheet.getColumn(gapCol).width = 2;
  }
}

function applyThinBorder(cell: ExcelJS.Cell) {
  applyBorder(cell, PLANTILLA_COLORS.border);
}

function applyBorder(
  cell: ExcelJS.Cell,
  color: string,
  style: ExcelJS.BorderStyle = "thin"
) {
  const side = { style, color: { argb: color } };
  cell.border = { top: side, left: side, bottom: side, right: side };
}

function outlineRange(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
  color = PLANTILLA_COLORS.borderStrong
) {
  const thin = { style: "thin" as const, color: { argb: color } };

  for (let col = startCol; col <= endCol; col++) {
    sheet.getCell(startRow, col).border = {
      ...sheet.getCell(startRow, col).border,
      top: thin,
    };
    sheet.getCell(endRow, col).border = {
      ...sheet.getCell(endRow, col).border,
      bottom: thin,
    };
  }
  for (let row = startRow; row <= endRow; row++) {
    sheet.getCell(row, startCol).border = {
      ...sheet.getCell(row, startCol).border,
      left: thin,
    };
    sheet.getCell(row, endCol).border = {
      ...sheet.getCell(row, endCol).border,
      right: thin,
    };
  }
}

function fillRange(
  sheet: ExcelJS.Worksheet,
  row: number,
  startCol: number,
  endCol: number,
  argb: string
) {
  for (let col = startCol; col <= endCol; col++) {
    fillCell(sheet.getCell(row, col), argb);
  }
}

function gridBorderRange(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
  color = PLANTILLA_COLORS.borderStrong
) {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      applyBorder(sheet.getCell(row, col), color);
    }
  }
}

/** Nº/color narrow; day & label columns wider; Dv/value column widest. */
const MONTH_BLOCK_COL_WIDTHS = [3.2, 5.5, 5.5, 5.5, 5.5, 8, 5.5, 5.5, 5.5] as const;

function applyMonthBlockColumnWidths(sheet: ExcelJS.Worksheet) {
  for (let blockIndex = 0; blockIndex < MONTHS_PER_ROW; blockIndex++) {
    for (let offset = 0; offset < COLS_PER_MONTH; offset++) {
      sheet.getColumn(colForMonthBlock(blockIndex, offset)).width =
        MONTH_BLOCK_COL_WIDTHS[offset];
    }
    for (const gapCol of monthGapCols(blockIndex)) {
      sheet.getColumn(gapCol).width = 2;
    }
  }
}

function setupColumnWidths(sheet: ExcelJS.Worksheet) {
  const totalCols = gridTotalCols();

  for (const gapCol of leadingGapCols()) {
    sheet.getColumn(gapCol).width = 2;
  }

  applyMonthBlockColumnWidths(sheet);

  void totalCols;
}

function fillCell(cell: ExcelJS.Cell, argb: string) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function styleMonthHeader(
  sheet: ExcelJS.Worksheet,
  row: number,
  startCol: number
) {
  sheet.mergeCells(row, startCol, row, startCol + 7);
  const cell = sheet.getCell(row, startCol);
  fillCell(cell, PLANTILLA_COLORS.monthHeaderBg);
  cell.font = { bold: true, size: 10 };
  cell.alignment = { horizontal: "center", vertical: "middle" };
}

function setWeekRowHeight(sheet: ExcelJS.Worksheet, row: number) {
  sheet.getRow(row).height = 16;
}

function renderEmptyWeekRow(
  sheet: ExcelJS.Worksheet,
  weekRow: number,
  baseCol: number
) {
  setWeekRowHeight(sheet, weekRow);

  const nCell = sheet.getCell(weekRow, baseCol);
  fillCell(nCell, PLANTILLA_COLORS.weekLabelBg);
  applyThinBorder(nCell);

  for (let i = 0; i < 7; i++) {
    const cell = sheet.getCell(weekRow, baseCol + 1 + i);
    applyThinBorder(cell);
    if (isWeekendDayIndex(i)) {
      fillCell(cell, PLANTILLA_COLORS.weekendBg);
    }
  }

  const subtotalCell = sheet.getCell(weekRow, baseCol + 8);
  fillCell(subtotalCell, PLANTILLA_COLORS.weekLabelBg);
  applyThinBorder(subtotalCell);
}

function renderMonthFooterRow(
  sheet: ExcelJS.Worksheet,
  row: number,
  baseCol: number,
  label: string,
  value: number,
  subtotalValue?: number
) {
  setWeekRowHeight(sheet, row);

  sheet.mergeCells(row, baseCol, row, baseCol + 2);
  const labelCell = sheet.getCell(row, baseCol);
  labelCell.value = label;
  fillCell(labelCell, PLANTILLA_COLORS.monthHeaderBg);
  labelCell.font = { bold: true, size: 9 };
  labelCell.alignment = { horizontal: "left", vertical: "middle" };
  applyBorder(labelCell, PLANTILLA_COLORS.borderStrong);

  sheet.mergeCells(row, baseCol + 3, row, baseCol + 7);
  const valueCell = sheet.getCell(row, baseCol + 3);
  valueCell.value = value;
  fillCell(valueCell, PLANTILLA_COLORS.monthHeaderBg);
  valueCell.font = { bold: true, size: 11 };
  valueCell.alignment = { horizontal: "center", vertical: "middle" };
  applyBorder(valueCell, PLANTILLA_COLORS.borderStrong);

  const subtotalCell = sheet.getCell(row, baseCol + 8);
  subtotalCell.value = subtotalValue ?? "";
  fillCell(subtotalCell, PLANTILLA_COLORS.monthHeaderBg);
  subtotalCell.font = { bold: true, size: 9 };
  subtotalCell.alignment = { horizontal: "center", vertical: "middle" };
  applyBorder(subtotalCell, PLANTILLA_COLORS.borderStrong);
}

function renderMonthBlock(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  blockIndex: number,
  year: number,
  month: number,
  inicioCurso: Date,
  finCurso: Date,
  dayEventMap: Map<string, EventoCalendario>,
  horasSemanales: number,
  maxWeekRows: number
): MonthBlockResult {
  const baseCol = colForMonthBlock(blockIndex, 0);
  const titleRow = startRow;
  const headerRow = startRow + 1;

  styleMonthHeader(sheet, titleRow, baseCol);
  sheet.getCell(titleRow, baseCol).value = monthLabel(year, month);
  applyBorder(sheet.getCell(titleRow, baseCol), PLANTILLA_COLORS.borderStrong);

  const headerBg = PLANTILLA_COLORS.weekdayHeaderBg;
  sheet.getCell(headerRow, baseCol).value = "Nº";
  fillCell(sheet.getCell(headerRow, baseCol), headerBg);
  sheet.getCell(headerRow, baseCol).font = { bold: true, size: 9 };
  sheet.getCell(headerRow, baseCol).alignment = { horizontal: "center" };
  applyBorder(sheet.getCell(headerRow, baseCol), PLANTILLA_COLORS.borderStrong);

  WEEKDAYS_CA.forEach((label, i) => {
    const cell = sheet.getCell(headerRow, baseCol + 1 + i);
    cell.value = label;
    fillCell(
      cell,
      isWeekendDayIndex(i)
        ? PLANTILLA_COLORS.weekendHeaderBg
        : headerBg
    );
    cell.font = { bold: true, size: 9 };
    cell.alignment = { horizontal: "center" };
    applyBorder(cell, PLANTILLA_COLORS.borderStrong);
  });

  const subtotalHeader = sheet.getCell(headerRow, baseCol + 8);
  subtotalHeader.value = "H/setm";
  fillCell(subtotalHeader, headerBg);
  subtotalHeader.font = { bold: true, size: 8 };
  subtotalHeader.alignment = { horizontal: "center", wrapText: true };
  applyBorder(subtotalHeader, PLANTILLA_COLORS.borderStrong);

  const weeks = buildWeekRowsForMonth(
    year,
    month,
    inicioCurso,
    finCurso,
    dayEventMap
  );
  let monthLectiveTotal = 0;
  let monthHoursTotal = 0;
  let weekRow = headerRow + 1;

  for (const week of weeks) {
    setWeekRowHeight(sheet, weekRow);

    const nCell = sheet.getCell(weekRow, baseCol);
    nCell.value = week.weekLectiveDays;
    fillCell(nCell, PLANTILLA_COLORS.weekLabelBg);
    nCell.font = { bold: true, size: 9 };
    nCell.alignment = { horizontal: "center" };
    applyBorder(nCell, PLANTILLA_COLORS.borderStrong);
    monthLectiveTotal += week.weekLectiveDays;

    week.days.forEach((dayData, i) => {
      const cell = sheet.getCell(weekRow, baseCol + 1 + i);
      applyBorder(cell, PLANTILLA_COLORS.borderStrong);
      cell.alignment = { horizontal: "center", vertical: "middle" };
      const isWeekend = isWeekendDayIndex(i);

      if (!dayData) {
        if (isWeekend) {
          fillCell(cell, PLANTILLA_COLORS.weekendBg);
        }
        return;
      }

      cell.value = dayData.dayNum;
      cell.font = { size: 9 };

      const color = getCellColor(
        dayData.date,
        inicioCurso,
        finCurso,
        dayEventMap
      );
      if (color) {
        fillCell(cell, color);
        if (
          color === PLANTILLA_COLORS.festivoOficial ||
          color === PLANTILLA_COLORS.festivoLocal
        ) {
          cell.font = { size: 9, color: { argb: "FFFFFFFF" }, bold: true };
        }
      } else if (isWeekend) {
        fillCell(cell, PLANTILLA_COLORS.weekendBg);
      }

      const evento = dayEventMap.get(dayData.date.toISOString().slice(0, 10));
      if (evento) {
        cell.note = evento.nombre;
      }
    });

    const weekHours = weekHoursFromLectiveDays(week.weekLectiveDays, horasSemanales);
    monthHoursTotal += weekHours;

    const subtotalCell = sheet.getCell(weekRow, baseCol + 8);
    subtotalCell.value = weekHours;
    fillCell(subtotalCell, PLANTILLA_COLORS.weekLabelBg);
    subtotalCell.font = { bold: true, size: 9 };
    subtotalCell.alignment = { horizontal: "center" };
    applyBorder(subtotalCell, PLANTILLA_COLORS.borderStrong);

    weekRow++;
  }

  while (weekRow < headerRow + 1 + maxWeekRows) {
    renderEmptyWeekRow(sheet, weekRow, baseCol);
    weekRow++;
  }

  const summaryRow = headerRow + 1 + maxWeekRows;
  renderMonthFooterRow(
    sheet,
    summaryRow,
    baseCol,
    "Dies lectius",
    monthLectiveTotal
  );

  const hoursRow = summaryRow + 1;
  renderMonthFooterRow(
    sheet,
    hoursRow,
    baseCol,
    "Hores mes",
    monthHoursTotal,
    monthHoursTotal
  );

  outlineRange(
    sheet,
    titleRow,
    hoursRow,
    baseCol,
    baseCol + COLS_PER_MONTH - 1,
    PLANTILLA_COLORS.borderStrong
  );

  return { endRow: hoursRow + 2, monthHours: monthHoursTotal };
}

function setBottomRowHeight(
  sheet: ExcelJS.Worksheet,
  row: number,
  height = 18
) {
  sheet.getRow(row).height = height;
}

function renderComputRow(
  sheet: ExcelJS.Worksheet,
  row: number,
  label: string,
  value: number,
  options: {
    format?: "days" | "hours" | "integer";
    vacances?: number;
    fixedBg?: boolean;
    empty?: boolean;
    longLabel?: boolean;
  } = {}
) {
  if (options.empty) {
    setBottomRowHeight(sheet, row, 8);
    gridBorderRange(sheet, row, row, COMPUT_LABEL_COL, COMPUT_BLOCK_END_COL);
    return;
  }

  setBottomRowHeight(sheet, row, options.longLabel ? 22 : 18);

  sheet.mergeCells(row, COMPUT_LABEL_COL, row, COMPUT_LABEL_END);
  const labelCell = sheet.getCell(row, COMPUT_LABEL_COL);
  labelCell.value = label;
  labelCell.font = { size: options.longLabel ? 9 : 10 };
  labelCell.alignment = {
    vertical: "middle",
    horizontal: "left",
    shrinkToFit: options.longLabel,
  };

  const valueCell = sheet.getCell(row, COMPUT_VALUE_COL);
  valueCell.value = value;
  valueCell.font = { size: 10, bold: true };
  valueCell.alignment = { horizontal: "center", vertical: "middle" };
  if (options.format === "days" || options.format === "integer") {
    valueCell.numFmt = "#,##0";
  } else {
    valueCell.numFmt = "#,##0.00";
  }

  if (options.vacances !== undefined) {
    const vacanceLabel = sheet.getCell(row, COMPUT_VACANCE_LABEL_COL);
    vacanceLabel.value = "Vacances";
    vacanceLabel.font = { size: 10 };
    vacanceLabel.alignment = { vertical: "middle", horizontal: "left" };

    const vacanceValue = sheet.getCell(row, COMPUT_VACANCE_VALUE_COL);
    vacanceValue.value = options.vacances;
    vacanceValue.font = { size: 10, bold: true };
    vacanceValue.alignment = { horizontal: "center", vertical: "middle" };
    vacanceValue.numFmt = "#,##0";
  } else {
    sheet.getCell(row, COMPUT_VACANCE_LABEL_COL).value = null;
    sheet.getCell(row, COMPUT_VACANCE_VALUE_COL).value = null;
  }

  if (options.fixedBg) {
    fillRange(
      sheet,
      row,
      COMPUT_LABEL_COL,
      COMPUT_BLOCK_END_COL,
      PLANTILLA_COLORS.computFixedBg
    );
  }

  gridBorderRange(sheet, row, row, COMPUT_LABEL_COL, COMPUT_BLOCK_END_COL);
}

function renderComputBlock(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  comput: ReturnType<typeof buildComputHores>,
  horasSemanales: number
): number {
  const jornadaLabel = `Hores menjador segons jornada ${formatHoresLabel(horasSemanales).replace(",", "'")}H`;

  renderComputRow(sheet, startRow, "Hores conveni", comput.horesConveni, {
    format: "integer",
    fixedBg: true,
  });
  renderComputRow(sheet, startRow + 1, "Dies anuals", comput.diesAnuals, {
    format: "days",
    vacances: comput.diesVacancesConveni,
    fixedBg: true,
  });
  renderComputRow(
    sheet,
    startRow + 2,
    "Dies totals menjadors",
    comput.diesTotalsMenjadors,
    { format: "days", vacances: comput.vacancesCalendar }
  );
  renderComputRow(sheet, startRow + 3, "", 0, { empty: true });
  renderComputRow(
    sheet,
    startRow + 4,
    "Hores menjador calendari escolar",
    comput.horesMenjadorCalendariEscolar,
    { longLabel: true }
  );
  renderComputRow(sheet, startRow + 5, jornadaLabel, comput.horesMenjadorSegonsJornada, {
    longLabel: true,
  });
  renderComputRow(sheet, startRow + 6, "Comput hores", comput.computHores);
  renderComputRow(sheet, startRow + 7, "", 0, { empty: true });

  const diffRow = startRow + 8;
  setBottomRowHeight(sheet, diffRow, 20);
  sheet.mergeCells(diffRow, COMPUT_LABEL_COL, diffRow, COMPUT_LABEL_END);
  const diffLabel = sheet.getCell(diffRow, COMPUT_LABEL_COL);
  diffLabel.value = "Diferencia hores";
  diffLabel.font = { size: 10, bold: true };
  diffLabel.alignment = { vertical: "middle", horizontal: "left" };

  sheet.getCell(diffRow, COMPUT_VALUE_COL).value = null;

  sheet.mergeCells(
    diffRow,
    COMPUT_VACANCE_LABEL_COL,
    diffRow,
    COMPUT_VACANCE_VALUE_COL
  );
  const diffCell = sheet.getCell(diffRow, COMPUT_VACANCE_LABEL_COL);
  diffCell.value = comput.diferenciaHores;
  diffCell.font = { size: 10, bold: true };
  diffCell.alignment = { horizontal: "center", vertical: "middle" };
  diffCell.numFmt = "#,##0.00";
  fillCell(diffCell, "FF92D050");

  gridBorderRange(sheet, diffRow, diffRow, COMPUT_LABEL_COL, COMPUT_BLOCK_END_COL);

  return diffRow;
}

function formatLegendCourseDates(inicio: Date, fin: Date): string {
  const fmt = (date: Date) => {
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };
  return `${fmt(inicio)} - ${fmt(fin)}`;
}

function renderLegendRow(
  sheet: ExcelJS.Worksheet,
  row: number,
  colorArgb: string,
  label: string,
  count: number | string | null,
  options?: { courseDates?: { inicio: Date; fin: Date } }
) {
  const isLongLabel = label.length > 28;
  setBottomRowHeight(sheet, row, isLongLabel || options?.courseDates ? 24 : 20);

  const colorCell = sheet.getCell(row, LEGEND_COLOR_COL);
  fillCell(colorCell, colorArgb);
  applyBorder(colorCell, PLANTILLA_COLORS.borderStrong);

  if (options?.courseDates) {
    const labelEndCol = LEGEND_LABEL_END - 1;
    sheet.mergeCells(row, LEGEND_LABEL_START, row, labelEndCol);
    const labelCell = sheet.getCell(row, LEGEND_LABEL_START);
    labelCell.value = label;
    labelCell.font = { size: 9 };
    labelCell.alignment = {
      horizontal: "left",
      vertical: "middle",
      shrinkToFit: true,
    };
    applyBorder(labelCell, PLANTILLA_COLORS.borderStrong);

    sheet.mergeCells(row, LEGEND_LABEL_END, row, LEGEND_COUNT_COL);
    const datesCell = sheet.getCell(row, LEGEND_LABEL_END);
    datesCell.value = formatLegendCourseDates(
      options.courseDates.inicio,
      options.courseDates.fin
    );
    datesCell.font = { size: 8, bold: true };
    datesCell.alignment = {
      horizontal: "center",
      vertical: "middle",
      shrinkToFit: true,
    };
    applyBorder(datesCell, PLANTILLA_COLORS.borderStrong);
    return;
  }

  sheet.mergeCells(row, LEGEND_LABEL_START, row, LEGEND_LABEL_END);
  const labelCell = sheet.getCell(row, LEGEND_LABEL_START);
  labelCell.value = label;
  labelCell.font = { size: isLongLabel ? 9 : 10 };
  labelCell.alignment = {
    horizontal: "left",
    vertical: "middle",
    shrinkToFit: isLongLabel,
  };
  applyBorder(labelCell, PLANTILLA_COLORS.borderStrong);

  const countCell = sheet.getCell(row, LEGEND_COUNT_COL);
  countCell.value = count ?? "";
  countCell.font = { size: 10, bold: true };
  countCell.alignment = { horizontal: "center", vertical: "middle" };
  applyBorder(countCell, PLANTILLA_COLORS.borderStrong);
}

function renderMonthSummaryRow(
  sheet: ExcelJS.Worksheet,
  row: number,
  monthLabelText: string,
  count: number,
  bold = false
) {
  setBottomRowHeight(sheet, row, bold ? 22 : 20);

  const nameEndCol = MONTH_SUMMARY_NAME_COL + COLS_PER_MONTH - 2;
  const countCol = MONTH_SUMMARY_NAME_COL + COLS_PER_MONTH - 1;

  sheet.mergeCells(row, MONTH_SUMMARY_NAME_COL, row, nameEndCol);
  const nameCell = sheet.getCell(row, MONTH_SUMMARY_NAME_COL);
  nameCell.value = monthLabelText;
  nameCell.font = { size: 10, bold };
  nameCell.alignment = {
    vertical: "middle",
    horizontal: "left",
    indent: 1,
  };
  gridBorderRange(sheet, row, row, MONTH_SUMMARY_NAME_COL, nameEndCol);

  const countCell = sheet.getCell(row, countCol);
  countCell.value = count;
  countCell.font = { size: 10, bold };
  countCell.alignment = { horizontal: "center", vertical: "middle" };
  applyBorder(countCell, PLANTILLA_COLORS.borderStrong);
}

export async function generarExcelCalendario(
  calendario: CalendarioConRelaciones
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Control Play — Calendari Escolar";
  workbook.created = new Date();

  const horasSemanales = calendario.horasSemanales;
  const sheetName = `${formatHoresLabel(horasSemanales).replace(",", ",")}h`;
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: false }],
  });

  const totalCols = gridTotalCols();
  setupColumnWidths(sheet);

  const dayEventMap = buildDayEventMap(calendario.eventos);
  const months = getMonthsInRange(calendario.inicioCurso, calendario.finCurso);
  const monthGroups = chunkMonths(months, MONTHS_PER_ROW);

  const [y1, y2] = calendario.curso.split("-");
  const cursoLong = y2 ? `${y1} - ${y2}` : calendario.curso;
  const cursoShort =
    y1 && y2 ? `${y1.slice(-2)}-${y2.slice(-2)}` : calendario.curso;
  const title = `Calendari ${cursoLong} Menjador ${calendario.colegio.nombre.toUpperCase()} ${cursoShort}`;
  sheet.mergeCells(1, 1, 1, totalCols);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 12 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  fillCell(titleCell, PLANTILLA_COLORS.titleBg);
  sheet.getRow(1).height = 22;

  sheet.getCell(2, 1).value = `Personal: ${calendario.tipoPersonal} · ${formatHoresLabel(horasSemanales)} h/setmana · ${formatHoresPerDia(horasSemanales)} h/dia lectiu`;
  sheet.getCell(2, 1).font = { size: 10, italic: true };

  let currentRow = 3;
  let totalComputHores = 0;

  for (const group of monthGroups) {
    const groupStartRow = currentRow;
    const maxWeekRows = Math.max(
      ...group.map((m) =>
        buildWeekRowsForMonth(
          m.year,
          m.month,
          calendario.inicioCurso,
          calendario.finCurso,
          dayEventMap
        ).length
      )
    );

    group.forEach((m, blockIndex) => {
      const result = renderMonthBlock(
        sheet,
        groupStartRow,
        blockIndex,
        m.year,
        m.month,
        calendario.inicioCurso,
        calendario.finCurso,
        dayEventMap,
        horasSemanales,
        maxWeekRows
      );
      totalComputHores += result.monthHours;
    });

    const groupEndRow = groupStartRow + 1 + maxWeekRows + 2;
    clearGapColumns(sheet, groupStartRow, groupEndRow);
    currentRow = groupEndRow + 2;
  }

  currentRow += 1;
  const legendStart = currentRow;
  const monthSummaries = buildMonthLectiveSummaries(
    months,
    calendario.inicioCurso,
    calendario.finCurso,
    dayEventMap
  );
  const totalLectiveDays = monthSummaries.reduce(
    (sum, month) => sum + month.lectiveDays,
    0
  );
  const vacancesCalendar = countEventDaysByType(calendario.eventos, ["vacaciones"]);
  const comput = buildComputHores({
    horasSemanales,
    totalLectiveDays,
    vacancesCalendar,
    computHores: totalComputHores,
    horesConveni: HORES_CONVENI_ANUALS,
    diesAnuals: DIES_ANUALS,
    diesVacancesConveni: DIES_VACANCES_CONVENI,
    jornadaReferencia: JORNADA_REFERENCIA_HORES,
  });

  LEGEND_ITEMS.forEach((item, index) => {
    const row = legendStart + index;
    const colorArgb =
      item.key === "inicio_fin"
        ? PLANTILLA_COLORS.inicioFinCurso
        : TIPO_TO_PLANTILLA_COLOR[item.key];
    const count =
      item.key === "inicio_fin"
        ? null
        : countEventDaysByType(calendario.eventos, [item.key]);

    renderLegendRow(
      sheet,
      row,
      colorArgb,
      item.label,
      count,
      item.key === "inicio_fin"
        ? {
            courseDates: {
              inicio: calendario.inicioCurso,
              fin: calendario.finCurso,
            },
          }
        : undefined
    );
  });

  monthSummaries.forEach((month, index) => {
    renderMonthSummaryRow(
      sheet,
      legendStart + index,
      month.label,
      month.lectiveDays
    );
  });

  const monthTotalRow = legendStart + monthSummaries.length;
  renderMonthSummaryRow(
    sheet,
    monthTotalRow,
    "TOTAL",
    totalLectiveDays,
    true
  );

  const computEndRow = renderComputBlock(
    sheet,
    legendStart,
    comput,
    horasSemanales
  );

  const bottomEndRow = Math.max(
    legendStart + LEGEND_ITEMS.length - 1,
    monthTotalRow,
    computEndRow
  );
  clearGapColumns(sheet, legendStart, bottomEndRow);

  outlineRange(
    sheet,
    legendStart,
    legendStart + LEGEND_ITEMS.length - 1,
    LEGEND_COLOR_COL,
    LEGEND_COUNT_COL
  );

  currentRow = bottomEndRow + 3;
  sheet.getCell(currentRow, 2).value = "Dades del curs";
  sheet.getCell(currentRow, 2).font = { bold: true };
  currentRow++;
  sheet.getCell(currentRow, 2).value = `Inici: ${formatDateDisplay(calendario.inicioCurso)}`;
  currentRow++;
  sheet.getCell(currentRow, 2).value = `Fi: ${formatDateDisplay(calendario.finCurso)}`;
  currentRow++;
  sheet.getCell(currentRow, 2).value = `Generat: ${formatDateDisplay(calendario.fechaGeneracion ?? new Date())}`;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function nombreArchivoExcel(
  colegio: Colegio,
  curso: string,
  horasSemanales?: number
): string {
  const slug = colegio.nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const hores =
    horasSemanales !== undefined
      ? `_${String(horasSemanales).replace(".", "-")}h`
      : "";
  return `Calendari_${slug}_${curso.replace("/", "-")}${hores}.xlsx`;
}
