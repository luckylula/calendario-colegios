import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDateInput, parseHorasSemanales } from "@/lib/constants";
import { isPrismaUniqueConstraintError } from "@/lib/prisma-errors";
import type { CalendarioPayload } from "@/lib/types";
import { sanitizeEventos, validateCalendarioPayload } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as CalendarioPayload & { id?: string };

  const error = validateCalendarioPayload(body);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const colegio = await prisma.colegio.findUnique({ where: { id: body.colegioId } });
  if (!colegio) {
    return NextResponse.json({ error: "Colegi no trobat" }, { status: 404 });
  }

  const eventosData = sanitizeEventos(body.eventos);
  const estado = body.estado ?? "borrador";
  const curso = body.curso.trim();
  const horasSemanales = parseHorasSemanales(
    body.horasSemanales,
    body.tipoPersonal === "coordinador" ? 37.5 : 13
  );

  let calendarioId = body.id;
  if (!calendarioId) {
    const existing = await prisma.calendarioCurso.findUnique({
      where: {
        colegioId_curso: {
          colegioId: body.colegioId,
          curso,
        },
      },
      select: { id: true },
    });
    if (existing) calendarioId = existing.id;
  }

  try {
    const calendario = await prisma.$transaction(async (tx) => {
      const data = {
        curso,
        inicioCurso: parseDateInput(body.inicioCurso),
        finCurso: parseDateInput(body.finCurso),
        estado,
        tipoPersonal: body.tipoPersonal,
        horasSemanales,
        creadoViaIa: body.creadoViaIa ?? false,
      };

      let record;
      if (calendarioId) {
        record = await tx.calendarioCurso.update({
          where: { id: calendarioId },
          data,
        });
        await tx.eventoCalendario.deleteMany({ where: { calendarioId: record.id } });
      } else {
        record = await tx.calendarioCurso.create({
          data: {
            ...data,
            colegioId: body.colegioId,
          },
        });
      }

      if (eventosData.length > 0) {
        await tx.eventoCalendario.createMany({
          data: eventosData.map((e) => ({
            ...e,
            calendarioId: record.id,
          })),
        });
      }

      return tx.calendarioCurso.findUnique({
        where: { id: record.id },
        include: { eventos: true, colegio: true },
      });
    });

    return NextResponse.json(calendario);
  } catch (err) {
    if (isPrismaUniqueConstraintError(err)) {
      return NextResponse.json(
        { error: "Ja existeix un calendari per a aquest curs" },
        { status: 409 }
      );
    }
    console.error("POST /api/calendarios:", err);
    return NextResponse.json(
      { error: "Error intern en guardar el calendari" },
      { status: 500 }
    );
  }
}
