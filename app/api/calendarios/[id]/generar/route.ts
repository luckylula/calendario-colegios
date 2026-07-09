import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generarExcelCalendario,
  nombreArchivoExcel,
} from "@/lib/excel/generar-calendario";
import { callN8nGenerarCalendario } from "@/lib/n8n";
import { formatDateInput } from "@/lib/constants";
import type { CalendarioPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const calendario = await prisma.calendarioCurso.findUnique({
      where: { id },
      include: {
        colegio: true,
        eventos: { orderBy: { fechaInicio: "asc" } },
      },
    });

    if (!calendario) {
      return NextResponse.json({ error: "Calendari no trobat" }, { status: 404 });
    }

    const actualizado = await prisma.calendarioCurso.update({
      where: { id },
      data: {
        estado: "confirmado",
        fechaGeneracion: new Date(),
      },
      include: {
        colegio: true,
        eventos: { orderBy: { fechaInicio: "asc" } },
      },
    });

    const n8nPayload: CalendarioPayload & { colegioNombre: string } = {
      colegioId: actualizado.colegioId,
      colegioNombre: actualizado.colegio.nombre,
      curso: actualizado.curso,
      inicioCurso: formatDateInput(actualizado.inicioCurso),
      finCurso: formatDateInput(actualizado.finCurso),
      tipoPersonal: actualizado.tipoPersonal,
      horasSemanales: actualizado.horasSemanales,
      creadoViaIa: actualizado.creadoViaIa,
      estado: "confirmado",
      eventos: actualizado.eventos.map((e) => ({
        tipo: e.tipo,
        nombre: e.nombre,
        fechaInicio: formatDateInput(e.fechaInicio),
        fechaFin: e.fechaFin ? formatDateInput(e.fechaFin) : null,
      })),
    };

    const n8nResult = await callN8nGenerarCalendario(id, n8nPayload);

    const excelBuffer = await generarExcelCalendario(actualizado);
    const filename = nombreArchivoExcel(
      actualizado.colegio,
      actualizado.curso,
      actualizado.horasSemanales
    );

    const headers = new Headers();
    headers.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("X-N8N-Status", n8nResult.ok ? "ok" : "skipped");
    if (n8nResult.message) {
      headers.set("X-N8N-Message", encodeURIComponent(n8nResult.message));
    }

    return new NextResponse(new Uint8Array(excelBuffer), { headers });
  } catch (error) {
    console.error("POST /api/calendarios/[id]/generar:", error);
    return NextResponse.json(
      { error: "Error en generar l'Excel del calendari" },
      { status: 500 }
    );
  }
}
