import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher } from "@/lib/access";
import { notifyMany } from "@/lib/notify";

const createSchema = z.object({
  body: z.string().min(1).max(5000),
  pinned: z.boolean().default(false),
});

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

async function canView(userId: string, role: string, courseId: string) {
  if (await canEdit(userId, role, courseId)) return true;
  const enrolment = await prisma.courseEnrolment.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });
  return !!enrolment && enrolment.status === "ACTIVE";
}

// GET /api/courses/[id]/announcements
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;

  if (!(await canView(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const announcements = await prisma.announcement.findMany({
    where: { courseId },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ announcements });
}

// POST /api/courses/[id]/announcements
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;

  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      courseId,
      authorId: session.user.id,
      body: parsed.data.body,
      pinned: parsed.data.pinned,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  // Notify all enrolled students
  const enrolments = await prisma.courseEnrolment.findMany({
    where: { courseId, status: "ACTIVE" },
    select: { userId: true },
  });
  const studentIds = enrolments.map(e => e.userId).filter(uid => uid !== session.user.id);
  if (studentIds.length > 0) {
    await notifyMany(studentIds, {
      type: "ANNOUNCEMENT",
      title: `New announcement: ${course.title}`,
      body: parsed.data.body.slice(0, 200),
      href: `/courses/${courseId}?tab=announcements`,
    });
  }

  return NextResponse.json({ announcement }, { status: 201 });
}
