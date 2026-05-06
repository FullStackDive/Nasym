import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseEnrolled } from "@/lib/access";

type Params = { id: string; quizId: string };

// POST /api/courses/[id]/quizzes/[quizId]/attempt — student submits answers, auto-graded
export async function POST(req: Request, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, quizId } = await params;
  const { role, id: userId } = session.user;

  if (role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can attempt quizzes" }, { status: 403 });
  }

  const enrolled = await isCourseEnrolled(userId, courseId);
  if (!enrolled) return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });

  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, courseId },
    include: { questions: { orderBy: { createdAt: "asc" } } },
  });
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  if (quiz.questions.length === 0) {
    return NextResponse.json({ error: "This quiz has no questions yet" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z.object({
    answers: z.array(z.number().int().min(0)).length(quiz.questions.length),
  }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "answers must be an array matching the number of questions", issues: parsed.error.flatten() }, { status: 400 });
  }

  // Auto-grade
  let correct = 0;
  const results = quiz.questions.map((q, i) => {
    const chosen = parsed.data.answers[i];
    const isCorrect = chosen === q.correctIdx;
    if (isCorrect) correct++;
    return { questionId: q.id, chosen, correct: isCorrect, correctIdx: q.correctIdx };
  });

  const score = Math.round((correct / quiz.questions.length) * 100);

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId,
      userId,
      answers: parsed.data.answers,
      score,
    },
  });

  return NextResponse.json({
    attempt: { ...attempt, results },
    correct,
    total: quiz.questions.length,
    score,
  }, { status: 201 });
}
