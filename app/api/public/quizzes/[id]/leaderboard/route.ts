import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function maskName(full?: string | null) {
  if (!full) return "Student";
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    select: { id: true, questions: { select: { id: true } } }
  });
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get best attempt per user by pulling attempts ordered and reducing in memory (simple starter).
  // For large scale, use SQL view or raw query.
  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId: quiz.id },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    take: 5000,
    include: { user: { select: { name: true } } }
  });

  const bestByUser = new Map<string, { name: string; score: number; createdAt: Date }>();
  for (const a of attempts) {
    if (!bestByUser.has(a.userId)) {
      bestByUser.set(a.userId, { name: maskName(a.user.name), score: a.score, createdAt: a.createdAt });
    }
  }

  const leaderboard = Array.from(bestByUser.values())
    .sort((x, y) => y.score - x.score || x.createdAt.getTime() - y.createdAt.getTime())
    .slice(0, 20)
    .map((x, idx) => ({ rank: idx + 1, name: x.name, score: x.score, total: quiz.questions.length }));

  return NextResponse.json({ leaderboard });
}
