import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDateInput } from "@/lib/constants";
import type { EventoFormInput } from "@/lib/types";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
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

  return NextResponse.json({
    ...calendario,
    inicioCurso: formatDateInput(calendario.inicioCurso),
    finCurso: formatDateInput(calendario.finCurso),
    eventos: calendario.eventos.map((e) => ({
      ...e,
      fechaInicio: formatDateInput(e.fechaInicio),
      fechaFin: e.fechaFin ? formatDateInput(e.fechaFin) : null,
    })) as EventoFormInput[],
  });
}
