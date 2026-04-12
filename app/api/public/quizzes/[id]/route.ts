import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      lesson: { select: { id: true, title: true } },
      questions: { select: { id: true, prompt: true, options: true }, orderBy: { createdAt: "asc" } }
    }
  });
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Ensure options returned as string[]
  const normalized = {
    ...quiz,
    questions: quiz.questions.map((q) => ({ ...q, options: q.options as any as string[] }))
  };

  return NextResponse.json({ quiz: normalized });
}
