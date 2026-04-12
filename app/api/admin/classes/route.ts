import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/server-session";
import { userHasPermission } from "@/lib/permissions";
import { z } from "zod";

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

  return NextResponse.json({ session: created });
}
