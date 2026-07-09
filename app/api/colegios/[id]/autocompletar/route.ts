import { NextResponse } from "next/server";
import { callN8nLeerCalendario } from "@/lib/n8n";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const data = await callN8nLeerCalendario(id);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error en autocompletar des del PDF";
    return NextResponse.json({ error: message }, { status: 501 });
  }
}
