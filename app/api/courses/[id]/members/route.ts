import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher } from "@/lib/access";

const addMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(["STUDENT", "TEACHER"]),
});

async function canManage(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

// GET /api/courses/[id]/members
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;

  if (!(await canManage(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [enrolments, teachers] = await Promise.all([
    prisma.courseEnrolment.findMany({
      where: { courseId },
      include: { user: { select: { id: true, name: true, email: true, status: true } } },
      orderBy: { enrolledAt: "asc" },
    }),
    prisma.courseTeacher.findMany({
      where: { courseId },
      include: { user: { select: { id: true, name: true, email: true, status: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return NextResponse.json({ enrolments, teachers });
}

// POST /api/courses/[id]/members — manually enrol/assign a user
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;

  if (!(await canManage(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { userId, role } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (role === "STUDENT") {
    const enrolment = await prisma.courseEnrolment.upsert({
      where: { courseId_userId: { courseId, userId } },
      create: { courseId, userId, status: "ACTIVE" },
      update: { status: "ACTIVE" },
    });
    return NextResponse.json({ enrolment }, { status: 201 });
  } else {
    const teacher = await prisma.courseTeacher.upsert({
      where: { courseId_userId: { courseId, userId } },
      create: { courseId, userId },
      update: {},
    });
    return NextResponse.json({ teacher }, { status: 201 });
  }
}
