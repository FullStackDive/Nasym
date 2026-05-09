import { prisma } from "@/lib/prisma";

export type AuditEntry = {
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
};

function ipFromRequest(req?: Request): string | null {
  if (!req) return null;
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

/**
 * Fire-and-forget audit log write. Failures are swallowed to avoid breaking
 * the request flow on a logging hiccup.
 */
export async function logAudit(entry: AuditEntry, req?: Request): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        metadata: (entry.metadata ?? undefined) as any,
        ip: entry.ip ?? ipFromRequest(req),
      },
    });
  } catch (err) {
    console.error("[audit] write failed:", err);
  }
}
