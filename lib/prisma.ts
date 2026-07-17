import "dotenv/config";
import { PrismaClient } from "../generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { getDatabaseUrl, normalizeDatabaseUrl } from "@/lib/database-url";

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
