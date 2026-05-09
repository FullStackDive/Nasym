import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/access";
import { logAudit } from "@/lib/audit";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const inv = await prisma.invitation.findUnique({ where: { id } });
  if (!inv) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  if (inv.status !== "PENDING") {
    return NextResponse.json({ error: `Cannot revoke a ${inv.status.toLowerCase()} invitation` }, { status: 400 });
  }

  await prisma.invitation.update({
    where: { id },
    data: { status: "REVOKED" },
  });

  await logAudit({
    actorId: auth.user.id,
    action: "invitation.revoke",
    targetType: "Invitation",
    targetId: id,
    metadata: { email: inv.email, role: inv.role },
  }, req);

  return NextResponse.json({ ok: true });
}
