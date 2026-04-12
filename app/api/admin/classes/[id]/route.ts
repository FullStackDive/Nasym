import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/server-session";
import { userHasPermission } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  scheduledAt: z.string().datetime(),
  roomName: z.string().min(6).max(80).regex(/^[a-zA-Z0-9-_]+$/),
  isLive: z.boolean().default(false)
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_classes");
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const cls = await prisma.classSession.findUnique({
    where: { id },
    select: { id: true, title: true, description: true, scheduledAt: true, isLive: true, roomName: true }
  });
  if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ session: cls });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_classes");
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const updated = await prisma.classSession.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      scheduledAt: new Date(parsed.data.scheduledAt),
      roomName: parsed.data.roomName,
      isLive: parsed.data.isLive
    },
    select: { id: true, title: true, description: true, scheduledAt: true, isLive: true, roomName: true }
  });

  return NextResponse.json({ session: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_classes");
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.classSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
