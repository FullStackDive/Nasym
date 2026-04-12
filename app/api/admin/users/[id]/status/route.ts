import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";
import { userHasPermission } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]),
  reason: z.string().max(200).optional().nullable(),
  // ISO string or null. For suspended users, provide a future datetime.
  suspendedUntil: z.string().datetime().optional().nullable()
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_users" as any);
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (id === session.user.id && parsed.data.status !== "ACTIVE") {
    return NextResponse.json({ error: "You cannot suspend/ban your own account." }, { status: 400 });
  }

  const until = parsed.data.suspendedUntil ? new Date(parsed.data.suspendedUntil) : null;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      status: parsed.data.status as any,
      statusReason: parsed.data.reason ?? null,
      suspendedUntil: parsed.data.status === "SUSPENDED" ? until : null
    },
    select: { id: true, email: true, name: true, role: true, status: true, statusReason: true, suspendedUntil: true }
  });

  return NextResponse.json({ user: updated });
}
