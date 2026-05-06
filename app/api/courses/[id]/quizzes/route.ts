import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher, isCourseEnrolled } from "@/lib/access";

const createSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(1).max(2000),
  moduleId: z.string().optional(),
});

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

// GET /api/courses/[id]/quizzes
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;
  const { role, id: userId } = session.user;

  const manage = await canEdit(userId, role, courseId);
  if (!manage) {
    const enrolled = await isCourseEnrolled(userId, courseId);
    if (!enrolled) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const quizzes = await prisma.quiz.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { questions: true, attempts: true } },
      module: { select: { id: true, title: true } },
    },
  });

  // For students: attach their best score per quiz
  let myBest: Record<string, number> = {};
  if (role === "STUDENT") {
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId, quiz: { courseId } },
      select: { quizId: true, score: true },
    });
    for (const a of attempts) {
      if (myBest[a.quizId] === undefined || a.score > myBest[a.quizId]) myBest[a.quizId] = a.score;
    }
  }

  return NextResponse.json({ quizzes, myBest });
}

// POST /api/courses/[id]/quizzes
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;
  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const quiz = await prisma.quiz.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      courseId,
      moduleId: parsed.data.moduleId || null,
      createdById: session.user.id,
    },
    include: {
      _count: { select: { questions: true, attempts: true } },
      module: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({ quiz }, { status: 201 });
}
