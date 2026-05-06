import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher, isCourseEnrolled } from "@/lib/access";

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  moduleId: z.string().nullable().optional(),
});

type Params = { id: string; quizId: string };

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

// GET /api/courses/[id]/quizzes/[quizId]
// Students see questions without correctIdx; teachers see everything
export async function GET(_req: Request, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, quizId } = await params;
  const { role, id: userId } = session.user;

  const manage = await canEdit(userId, role, courseId);
  if (!manage) {
    const enrolled = await isCourseEnrolled(userId, courseId);
    if (!enrolled) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, courseId },
    include: {
      questions: { orderBy: { createdAt: "asc" } },
      module: { select: { id: true, title: true } },
      _count: { select: { attempts: true } },
    },
  });

  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  // Hide correct answers from students
  const questions = manage
    ? quiz.questions
    : quiz.questions.map(q => ({ ...q, correctIdx: undefined }));

  return NextResponse.json({ quiz: { ...quiz, questions } });
}

// PATCH /api/courses/[id]/quizzes/[quizId]
export async function PATCH(req: Request, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, quizId } = await params;
  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const quiz = await prisma.quiz.findFirst({ where: { id: quizId, courseId } });
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const d = parsed.data;
  const updated = await prisma.quiz.update({
    where: { id: quizId },
    data: {
      ...(d.title !== undefined && { title: d.title }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.moduleId !== undefined && { moduleId: d.moduleId }),
    },
    include: { _count: { select: { questions: true, attempts: true } }, module: { select: { id: true, title: true } } },
  });

  return NextResponse.json({ quiz: updated });
}

// DELETE /api/courses/[id]/quizzes/[quizId]
export async function DELETE(_req: Request, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, quizId } = await params;
  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const quiz = await prisma.quiz.findFirst({ where: { id: quizId, courseId } });
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  await prisma.quiz.delete({ where: { id: quizId } });
  return NextResponse.json({ ok: true });
}
