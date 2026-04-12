import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";
import { userHasPermission } from "@/lib/permissions";
import { z } from "zod";

export async function GET() {
  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      title: true,
      description: true,
      createdAt: true,
      lesson: { select: { id: true, title: true } },
      questions: { select: { id: true } }
    }
  });
  return NextResponse.json({ quizzes });
}

const schema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  lessonId: z.string().optional(),
  questions: z.array(z.object({
    prompt: z.string().min(3).max(500),
    options: z.array(z.string().min(1).max(200)).min(2).max(8),
    correctIdx: z.number().int().min(0).max(7)
  })).min(1).max(50)
});

export async function POST(req: Request) {
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_quizzes" as any);
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const quiz = await prisma.quiz.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      lessonId: parsed.data.lessonId,
      createdById: session.user.id,
      questions: {
        create: parsed.data.questions.map((q) => ({
          prompt: q.prompt,
          options: q.options,
          correctIdx: q.correctIdx
        }))
      }
    },
    select: { id: true }
  });

  return NextResponse.json({ quiz });
}
