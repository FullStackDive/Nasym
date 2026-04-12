import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { id: true, title: true, description: true, videoUrl: true, tags: true, createdAt: true }
  });
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const quizzes = await prisma.quiz.findMany({
    where: { lessonId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, description: true, createdAt: true }
  });

  return NextResponse.json({ lesson, quizzes });
}
