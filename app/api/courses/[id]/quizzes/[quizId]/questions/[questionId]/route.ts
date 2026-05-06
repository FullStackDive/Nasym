import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher } from "@/lib/access";

type Params = { id: string; quizId: string; questionId: string };

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

// DELETE /api/courses/[id]/quizzes/[quizId]/questions/[questionId]
export async function DELETE(_req: Request, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, quizId, questionId } = await params;
  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const question = await prisma.quizQuestion.findFirst({
    where: { id: questionId, quizId },
  });
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  await prisma.quizQuestion.delete({ where: { id: questionId } });
  return NextResponse.json({ ok: true });
}
