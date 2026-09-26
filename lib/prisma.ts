import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function connectionLimit() {
  const fallback = process.env.RAILWAY_ENVIRONMENT ? 5 : 1;
  const parsed = Number(process.env.DB_CONNECTION_LIMIT ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(20, Math.max(1, Math.trunc(parsed)));
}

function enhanceUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw;

  const limit = connectionLimit();
  let url = raw
    .replace(/([?&])connection_limit=\d+/i, `$1connection_limit=${limit}`)
    .replace(/([?&])pool_timeout=\d+/i, "$1pool_timeout=20");

  const hasLimit = /[?&]connection_limit=/.test(url);
  const hasTimeout = /[?&]pool_timeout=/.test(url);
  const hasPgBouncer = /[?&]pgbouncer=/.test(url);
  const looksPooled = /pooler\.|pgbouncer/i.test(url);
  const sep = url.includes("?") ? "&" : "?";
  const parts: string[] = [];

  if (!hasLimit) parts.push(`connection_limit=${limit}`);
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

// Railway runs Next.js as a persistent Node process. Keep one PrismaClient per
// process so route modules share the same pool instead of opening extra pools.
globalForPrisma.prisma = prisma;
