import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher } from "@/lib/access";

type Params = { id: string; quizId: string };

// GET /api/courses/[id]/quizzes/[quizId]/attempts
// Teacher/admin: all attempts with student info
// Student: own attempts only
export async function GET(_req: Request, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, quizId } = await params;
  const { role, id: userId } = session.user;

  const canManage = role === "ADMIN" || (role === "TEACHER" && await isCourseTeacher(userId, courseId));

  if (canManage) {
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ attempts });
  }

  // Students: own attempts only
  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId, userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ attempts });
}
