import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/access";
import { sendEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.status !== "PENDING_APPROVAL") {
    return NextResponse.json({ error: `User is already ${user.status.toLowerCase()}` }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      status: "ACTIVE",
      approvedAt: new Date(),
      approvedById: auth.user.id,
    },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  void sendEmail({
    to: updated.email,
    subject: "Your Nasym-ur-Rahmah account is active",
    html: `
      <h2>Assalamu alaikum, ${updated.name}!</h2>
      <p>Your account has been approved. You can now sign in and start learning.</p>
      <p><a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/signin">Sign in</a></p>
    `,
  });

  await logAudit({
    actorId: auth.user.id,
    action: "user.approve",
    targetType: "User",
    targetId: updated.id,
    metadata: { email: updated.email, role: updated.role },
  }, req);

  return NextResponse.json({ user: updated });
}
