import type { CalendarioPayload } from "@/lib/types";

interface N8nGenerarResponse {
  ok: boolean;
  message?: string;
}

export async function callN8nGenerarCalendario(
  calendarioId: string,
  payload: CalendarioPayload & { colegioNombre: string }
): Promise<N8nGenerarResponse> {
  const baseUrl = process.env.N8N_BASE_URL;
  const webhookPath = process.env.N8N_WEBHOOK_GENERAR_CALENDARIO;

  if (!baseUrl || !webhookPath) {
    return { ok: false, message: "n8n no configurat (Fase 2)" };
  }

  const url = `${baseUrl.replace(/\/$/, "")}${webhookPath}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = process.env.N8N_WEBHOOK_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        calendario_id: calendarioId,
        colegio_id: payload.colegioId,
        colegio_nombre: payload.colegioNombre,
        ...payload,
      }),
    });

    if (!response.ok) {
      return { ok: false, message: `n8n ha respost amb error ${response.status}` };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconegut";
    return { ok: false, message };
  }
}

export async function callN8nLeerCalendario(colegioId: string) {
  const baseUrl = process.env.N8N_BASE_URL;
  const webhookPath = process.env.N8N_WEBHOOK_LEER_CALENDARIO;

  if (!baseUrl || !webhookPath) {
    throw new Error("n8n no configurat. Aquesta funció estarà disponible a la Fase 3.");
  }

  const url = `${baseUrl.replace(/\/$/, "")}${webhookPath}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = process.env.N8N_WEBHOOK_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ colegio_id: colegioId }),
  });

  if (!response.ok) {
    throw new Error(`n8n ha respost amb error ${response.status}`);
  }

  return response.json();
}
