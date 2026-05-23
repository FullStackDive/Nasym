import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function enhanceUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  let url = raw
    .replace(/([?&])connection_limit=\d+/i, "$1connection_limit=10")
    .replace(/([?&])pool_timeout=\d+/i, "$1pool_timeout=20");
  const hasLimit = /[?&]connection_limit=/.test(url);
  const hasTimeout = /[?&]pool_timeout=/.test(url);
  const hasPgBouncer = /[?&]pgbouncer=/.test(url);
  const looksPooled = /pooler\.|pgbouncer/i.test(url);
  const sep = url.includes("?") ? "&" : "?";
  const parts: string[] = [];
  if (!hasLimit) parts.push("connection_limit=10");
  if (!hasTimeout) parts.push("pool_timeout=20");
  if (!hasPgBouncer && looksPooled) parts.push("pgbouncer=true");
  return parts.length ? `${url}${sep}${parts.join("&")}` : url;
}

const datasourceUrl = enhanceUrl(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
