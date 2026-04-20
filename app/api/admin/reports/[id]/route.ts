import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";
import { userHasPermission } from "@/lib/permissions";
import { z } from "zod";
import { sendEmail } from "@/lib/email";

const schema = z.object({
  status: z.enum(["OPEN", "RESOLVED"])
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_reports" as any);
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Fetch reporter info before updating so we can email them
  const reportRecord = parsed.data.status === "RESOLVED"
    ? await prisma.report.findUnique({
        where: { id },
        select: { reason: true, reporter: { select: { email: true, name: true } } }
      })
    : null;

  const updated = await prisma.report.update({
    where: { id },
    data: {
      status: parsed.data.status as any,
      resolvedAt: parsed.data.status === "RESOLVED" ? new Date() : null,
      resolvedById: parsed.data.status === "RESOLVED" ? session.user.id : null
    },
    select: { id: true, status: true }
  });

  if (parsed.data.status === "RESOLVED" && reportRecord?.reporter) {
    void sendEmail({
      to: reportRecord.reporter.email,
      subject: "Your report has been resolved",
      html: `
        <h2>Assalamu alaikum, ${reportRecord.reporter.name}!</h2>
        <p>Your report regarding "<strong>${reportRecord.reason}</strong>" has been reviewed and resolved by a moderator.</p>
        <p>Thank you for helping keep Nasym-ur-Rahmah safe.</p>
      `
    });
  }

  return NextResponse.json({ report: updated });
}
