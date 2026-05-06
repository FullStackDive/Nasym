import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher } from "@/lib/access";

const questionSchema = z.object({
  prompt: z.string().min(1).max(2000),
  options: z.array(z.string().min(1).max(500)).min(2).max(6),
  correctIdx: z.number().int().min(0),
}).refine(d => d.correctIdx < d.options.length, {
  message: "correctIdx must be a valid option index",
});

type Params = { id: string; quizId: string };

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

// POST /api/courses/[id]/quizzes/[quizId]/questions — add a question
export async function POST(req: Request, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, quizId } = await params;
  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const quiz = await prisma.quiz.findFirst({ where: { id: quizId, courseId } });
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const question = await prisma.quizQuestion.create({
    data: {
      quizId,
      prompt: parsed.data.prompt,
      options: parsed.data.options,
      correctIdx: parsed.data.correctIdx,
    },
  });

  return NextResponse.json({ question }, { status: 201 });
}
