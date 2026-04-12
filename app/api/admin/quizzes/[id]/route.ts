import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";
import { userHasPermission } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  lessonId: z.string().optional().nullable(),
  questions: z.array(z.object({
    prompt: z.string().min(3).max(500),
    options: z.array(z.string().min(1).max(200)).min(2).max(8),
    correctIdx: z.number().int().min(0).max(7)
  })).min(1).max(50)
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_quizzes" as any);
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      lessonId: true,
      createdAt: true,
      questions: { select: { id: true, prompt: true, options: true, correctIdx: true }, orderBy: { createdAt: "asc" } }
    }
  });
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    quiz: {
      ...quiz,
      questions: quiz.questions.map((q) => ({ ...q, options: q.options as any as string[] }))
    }
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_quizzes" as any);
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Replace questions (simple + safe)
  await prisma.quizQuestion.deleteMany({ where: { quizId: id } });

  const quiz = await prisma.quiz.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      lessonId: parsed.data.lessonId ?? null,
      questions: {
        create: parsed.data.questions.map((q) => ({ prompt: q.prompt, options: q.options, correctIdx: q.correctIdx }))
      }
    },
    select: { id: true }
  });

  return NextResponse.json({ quiz });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_quizzes" as any);
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.quiz.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
