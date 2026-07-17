const DATABASE_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
] as const;

function cleanEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^["']|["']$/g, "");
}

export function resolveDatabaseUrlFromEnv(): string | undefined {
  for (const key of DATABASE_ENV_KEYS) {
    const value = cleanEnvValue(process.env[key]);
    if (value) return value;
  }
  return undefined;
}

export function parseDatabaseHost(connectionString: string): string | null {
  try {
    const normalized = connectionString.replace(/^postgresql:\/\//i, "https://");
    return new URL(normalized).hostname || null;
  } catch {
    return null;
  }
}

export interface DatabaseUrlDiagnostics {
  configured: boolean;
  source: (typeof DATABASE_ENV_KEYS)[number] | null;
  host: string | null;
  pooled: boolean;
  ssl: boolean;
  validHost: boolean;
}

export function getDatabaseUrlDiagnostics(): DatabaseUrlDiagnostics {
  let source: DatabaseUrlDiagnostics["source"] = null;
  let raw: string | undefined;

  for (const key of DATABASE_ENV_KEYS) {
    const value = cleanEnvValue(process.env[key]);
    if (value) {
      source = key;
      raw = value;
      break;
    }
  }

  if (!raw) {
    return {
      configured: false,
      source: null,
      host: null,
      pooled: false,
      ssl: false,
      validHost: false,
    };
  }

  const host = parseDatabaseHost(raw);
  return {
    configured: true,
    source,
    host,
    pooled: raw.includes("-pooler"),
    ssl: raw.includes("sslmode=require"),
    validHost: Boolean(host && host.includes("neon.tech")),
  };
}

export function getDatabaseUrl(): string {
  const connectionString = resolveDatabaseUrlFromEnv();
  if (!connectionString) {
    throw new Error(
      "No hay URL de base de datos. En Vercel añade DATABASE_URL (URL pooled de Neon) en Settings → Environment Variables."
    );
  }

  const host = parseDatabaseHost(connectionString);
  if (!host || !host.includes(".")) {
    throw new Error(
      `DATABASE_URL inválida (host: "${host ?? "desconocido"}"). Copia la URL pooled completa desde Neon, sin comillas.`
    );
  }

  return connectionString;
}

/** Neon pooled URL works best on Vercel; channel_binding can break serverless pg. */
export function normalizeDatabaseUrl(connectionString: string): string {
  try {
    const normalized = connectionString.replace(/^postgresql:\/\//i, "https://");
    const url = new URL(normalized);
    url.searchParams.delete("channel_binding");
    if (!url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }
    return url.toString().replace(/^https:\/\//i, "postgresql://");
  } catch {
    return connectionString;
  }
}
