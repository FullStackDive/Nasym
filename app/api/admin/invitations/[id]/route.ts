import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/access";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  return NextResponse.json({ ok: true });
}
