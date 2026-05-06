import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public lookup so the accept-invite page can show the recipient
 * which course/role they're being invited to before they fill out the form.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await prisma.invitation.findUnique({
    where: { token },
    include: { course: { select: { id: true, title: true } } },
  });

  if (!inv) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });

  if (inv.status !== "PENDING") {
    return NextResponse.json({ error: `Invitation already ${inv.status.toLowerCase()}` }, { status: 410 });
  }

  if (inv.expiresAt.getTime() < Date.now()) {
    await prisma.invitation.update({ where: { id: inv.id }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "Invitation expired" }, { status: 410 });
  }

  return NextResponse.json({
    invitation: {
      email: inv.email,
      name: inv.name,
      role: inv.role,
      course: inv.course,
      expiresAt: inv.expiresAt,
    },
  });
}
