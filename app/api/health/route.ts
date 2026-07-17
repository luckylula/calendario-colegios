import { getDatabaseUrlDiagnostics } from "@/lib/database-url";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const diagnostics = getDatabaseUrlDiagnostics();

  if (!diagnostics.configured) {
    return Response.json(
      {
        ok: false,
        error: "MISSING_DATABASE_URL",
        hint: "Añade DATABASE_URL en Vercel con la URL pooled de Neon (-pooler en el host).",
        diagnostics,
      },
      { status: 500 }
    );
  }

  if (!diagnostics.validHost) {
    return Response.json(
      {
        ok: false,
        error: "INVALID_DATABASE_HOST",
        hint: `El host "${diagnostics.host}" no parece Neon. Usa la URL pooled de console.neon.tech.`,
        diagnostics,
      },
      { status: 500 }
    );
  }

  if (!diagnostics.pooled) {
    return Response.json(
      {
        ok: false,
        error: "NOT_POOLED",
        hint: "Usa la URL 'Pooled connection' de Neon (hostname con -pooler).",
        diagnostics,
      },
      { status: 500 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, diagnostics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      {
        ok: false,
        error: "CONNECTION_FAILED",
        message,
        diagnostics,
      },
      { status: 500 }
    );
  }
}
