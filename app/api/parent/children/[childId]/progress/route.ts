import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { childId: string };

// GET /api/parent/children/[childId]/progress
// Returns the child's submissions and quiz attempts for all their enrolled courses
export async function GET(_req: Request, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { childId } = await params;
  const { role, id: parentId } = session.user;

  // Admins can see any child; parents only their own
  if (role !== "ADMIN") {
    if (role !== "PARENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const child = await prisma.user.findFirst({ where: { id: childId, parentId } });
    if (!child) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [child, submissions, attempts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: childId },
      select: {
        id: true,
        name: true,
        email: true,
        enrolments: {
          select: {
            enrolledAt: true,
            course: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    }),
    prisma.assignmentSubmission.findMany({
      where: { studentId: childId },
      orderBy: { submittedAt: "desc" },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            maxPoints: true,
            dueAt: true,
            course: { select: { id: true, title: true } },
          },
        },
      },
    }),
    prisma.quizAttempt.findMany({
      where: { userId: childId },
      orderBy: { createdAt: "desc" },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            course: { select: { id: true, title: true } },
            _count: { select: { questions: true } },
          },
        },
      },
    }),
  ]);

  if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ child, submissions, attempts });
}
