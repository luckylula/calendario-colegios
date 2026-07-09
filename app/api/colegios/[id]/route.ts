import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const colegio = await prisma.colegio.findUnique({
    where: { id },
    include: {
      calendarios: {
        orderBy: { curso: "desc" },
        select: {
          id: true,
          curso: true,
          estado: true,
          fechaGeneracion: true,
          createdAt: true,
        },
      },
    },
  });

  if (!colegio) {
    return NextResponse.json({ error: "Colegi no trobat" }, { status: 404 });
  }

  return NextResponse.json(colegio);
}
