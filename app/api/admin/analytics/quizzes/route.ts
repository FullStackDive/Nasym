import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";
import { userHasPermission } from "@/lib/permissions";

export async function GET() {
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_quizzes" as any);
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, title: true, createdAt: true, questions: { select: { id: true } } }
  });

  const stats = [];
  for (const q of quizzes) {
    const agg = await prisma.quizAttempt.aggregate({
      where: { quizId: q.id },
      _count: { _all: true },
      _avg: { score: true },
      _max: { score: true }
    });
    const uniqueUsers = await prisma.quizAttempt.findMany({
      where: { quizId: q.id },
      select: { userId: true },
      distinct: ["userId"]
    });
    stats.push({
      id: q.id,
      title: q.title,
      createdAt: q.createdAt,
      totalQuestions: q.questions.length,
      attempts: agg._count._all,
      uniqueUsers: uniqueUsers.length,
      avgScore: agg._avg.score ?? 0,
      maxScore: agg._max.score ?? 0
    });
  }

  return NextResponse.json({ stats });
}
