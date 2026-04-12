import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    select: { id: true, title: true, questions: { select: { id: true } } }
  });
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalQuestions = quiz.questions.length;

  const agg = await prisma.quizAttempt.aggregate({
    where: { quizId: quiz.id },
    _count: { _all: true },
    _avg: { score: true },
    _max: { score: true }
  });

  const uniqueUsers = await prisma.quizAttempt.findMany({
    where: { quizId: quiz.id },
    select: { userId: true },
    distinct: ["userId"]
  });

  return NextResponse.json({
    quizId: quiz.id,
    totalQuestions,
    attempts: agg._count._all,
    uniqueUsers: uniqueUsers.length,
    avgScore: agg._avg.score ?? 0,
    maxScore: agg._max.score ?? 0
  });
}
