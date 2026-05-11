import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: lessonId } = await params;
  const comments = await prisma.lessonComment.findMany({
    where: { lessonId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      body: true,
      createdAt: true,
      userId: true,
      user: { select: { id: true, name: true, role: true } }
    }
  });
  return NextResponse.json({ comments });
}

const schema = z.object({ body: z.string().min(1).max(2000) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: lessonId } = await params;
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const comment = await prisma.lessonComment.create({
    data: { lessonId, userId: session.user.id, body: parsed.data.body.trim() },
    select: {
      id: true,
      body: true,
      createdAt: true,
      userId: true,
      user: { select: { id: true, name: true, role: true } }
    }
  });
  return NextResponse.json({ comment }, { status: 201 });
}
