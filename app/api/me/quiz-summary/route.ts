import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";

export async function GET() {
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      score: true,
      createdAt: true,
      quiz: { select: { id: true, title: true, questions: { select: { id: true } } } }
    }
  });

  const totalAttempts = attempts.length;
  const avgScore = totalAttempts > 0
    ? attempts.reduce((s, a) => s + a.score, 0) / totalAttempts
    : 0;

  const recentAttempts = attempts.slice(0, 5).map((a) => ({
    id: a.id,
    score: a.score,
    total: a.quiz.questions.length,
    quizTitle: a.quiz.title,
    quizId: a.quiz.id,
    createdAt: a.createdAt
  }));

  return NextResponse.json({ totalAttempts, avgScore, recentAttempts });
}
