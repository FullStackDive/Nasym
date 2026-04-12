import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";
import { z } from "zod";

const schema = z.object({
  answersByQuestionId: z.record(z.string(), z.number().int().nonnegative())
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: true }
  });
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let score = 0;
  const answersArr: number[] = [];
  for (const q of quiz.questions) {
    const ans = parsed.data.answersByQuestionId[q.id];
    answersArr.push(typeof ans === "number" ? ans : -1);
    if (typeof ans === "number" && ans === q.correctIdx) score += 1;
  }

  const feedback = quiz.questions.map((q, i) => ({
    questionId: q.id,
    yourIdx: answersArr[i],
    correctIdx: q.correctIdx,
    correct: answersArr[i] === q.correctIdx
  }));

  await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId: session.user.id,
      answers: answersArr,
      score
    }
  });

  return NextResponse.json({ result: { score, total: quiz.questions.length, feedback } });
}
