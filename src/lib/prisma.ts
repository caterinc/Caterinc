import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildDatasourceUrl(): string {
  const base = process.env.DATABASE_URL ?? "";
  if (!base || base.includes("connection_limit")) return base;
  const sep = base.includes("?") ? "&" : "?";
  // connection_limit=1 is critical for Neon + Vercel serverless (prevents connection exhaustion)
  return `${base}${sep}connection_limit=1&pool_timeout=30&connect_timeout=30`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: buildDatasourceUrl(),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
