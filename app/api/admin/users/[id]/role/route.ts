import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/server-session";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  role: z.enum(["ADMIN", "TEACHER", "STUDENT", "PARENT"]),
});

// PUT /api/admin/users/[id]/role — change a user's role.
// Admin-only. If the target is being promoted to ADMIN, all permissions are
// granted; if demoted from ADMIN, granted permissions are kept (they're
// independent of role for non-admins).
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (id === session.user.id && parsed.data.role !== "ADMIN") {
    return NextResponse.json({ error: "You cannot demote your own admin account." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
    select: { id: true, email: true, name: true, role: true, status: true },
  });

  // Promote → grant all permissions (matches the seed + promote-admin script).
  if (parsed.data.role === "ADMIN" && existing.role !== "ADMIN") {
    const perms = await prisma.permission.findMany({ select: { id: true } });
    for (const p of perms) {
      await prisma.userPermission.upsert({
        where: { userId_permissionId: { userId: id, permissionId: p.id } },
        update: {},
        create: { userId: id, permissionId: p.id },
      });
    }
  }

  await logAudit(
    {
      actorId: session.user.id,
      action: `user.role.change`,
      targetType: "User",
      targetId: id,
      metadata: { from: existing.role, to: parsed.data.role },
    },
    req
  );

  return NextResponse.json({ user: updated });
}
