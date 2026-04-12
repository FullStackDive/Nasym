import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    select: { id: true, questions: { select: { id: true } } }
  });
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId: quiz.id, userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, score: true, createdAt: true }
  });

  return NextResponse.json({ total: quiz.questions.length, attempts });
}
