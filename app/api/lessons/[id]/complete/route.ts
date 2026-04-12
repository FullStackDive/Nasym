import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: lessonId } = await params;
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId },
    update: { completedAt: new Date() }
  });

  return NextResponse.json({ ok: true, completed: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: lessonId } = await params;
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  await prisma.lessonProgress.deleteMany({
    where: { userId: session.user.id, lessonId }
  });

  return NextResponse.json({ ok: true, completed: false });
}
