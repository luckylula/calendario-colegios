import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const colegios = await prisma.colegio.findMany({
    orderBy: { nombre: "asc" },
    include: {
      _count: { select: { calendarios: true } },
    },
  });

  return NextResponse.json(colegios);
}
