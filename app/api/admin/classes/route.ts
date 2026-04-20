import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/server-session";
import { userHasPermission } from "@/lib/permissions";
import { z } from "zod";
import { sendEmail } from "@/lib/email";

export async function GET() {
  const sessions = await prisma.classSession.findMany({
    orderBy: [{ isLive: "desc" }, { scheduledAt: "asc" }],
    take: 100,
    select: { id: true, title: true, description: true, scheduledAt: true, isLive: true, roomName: true }
  });
  return NextResponse.json({ sessions });
}

const schema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  scheduledAt: z.string().datetime(),
  roomName: z.string().min(6).max(80).regex(/^[a-zA-Z0-9-_]+$/),
  isLive: z.boolean().default(false)
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_classes");
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const created = await prisma.classSession.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      scheduledAt: new Date(parsed.data.scheduledAt),
      roomName: parsed.data.roomName,
      isLive: parsed.data.isLive,
      createdById: session.user.id
    },
    select: { id: true, title: true, description: true, scheduledAt: true, isLive: true, roomName: true }
  });

  // Notify all active users about the new class (fire-and-forget)
  // TODO: replace with a job queue before scaling to production
  prisma.user.findMany({ where: { status: "ACTIVE" }, select: { email: true, name: true } }).then((users) => {
    void Promise.all(
      users.map((u) =>
        sendEmail({
          to: u.email,
          subject: `New class scheduled: ${created.title}`,
          html: `
            <h2>Assalamu alaikum, ${u.name}!</h2>
            <p>A new class has been scheduled on Nasym-ur-Rahmah:</p>
            <p><strong>${created.title}</strong></p>
            <p>${created.description}</p>
            <p>Scheduled at: ${new Date(created.scheduledAt).toLocaleString()}</p>
            <p><a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/classes">View classes</a></p>
          `
        })
      )
    );
  });

  return NextResponse.json({ session: created });
}
