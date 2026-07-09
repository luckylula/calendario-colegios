import "dotenv/config";
import { PrismaClient } from "../generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function getDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL no está configurada. En Vercel: Settings → Environment Variables."
    );
  }
  return connectionString;
}

/** Neon pooled URL works best on Vercel; channel_binding can break serverless pg. */
function normalizeDatabaseUrl(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete("channel_binding");
    if (!url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}

function createPool(): Pool {
  const connectionString = normalizeDatabaseUrl(getDatabaseUrl());

  if (
    process.env.NODE_ENV === "production" &&
    connectionString.includes("neon.tech") &&
    !connectionString.includes("-pooler")
  ) {
    console.warn(
      "DATABASE_URL debería usar el endpoint pooled de Neon (hostname con -pooler) en Vercel."
    );
  }

  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });
}

const pool = createPool();
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
