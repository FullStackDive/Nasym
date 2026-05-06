import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher, isCourseEnrolled } from "@/lib/access";

const createSchema = z.object({
  title: z.string().min(2).max(200),
  instructions: z.string().min(1).max(10000),
  moduleId: z.string().optional(),
  attachmentUrl: z.string().url().optional().or(z.literal("")),
  dueAt: z.string().datetime().optional().nullable(),
  maxPoints: z.number().int().min(1).max(1000).default(100),
  isPublished: z.boolean().default(true),
});

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

// GET /api/courses/[id]/assignments
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;
  const { role, id: userId } = session.user;

  const canManage = await canEdit(userId, role, courseId);
  if (!canManage) {
    const enrolled = await isCourseEnrolled(userId, courseId);
    if (!enrolled) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignments = await prisma.assignment.findMany({
    where: {
      courseId,
      ...(!canManage && { isPublished: true }),
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    include: {
      module: { select: { id: true, title: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { submissions: true } },
    },
  });

  // For students: include their own submission status
  let mySubmissions: Record<string, { status: string; score: number | null }> = {};
  if (role === "STUDENT") {
    const subs = await prisma.assignmentSubmission.findMany({
      where: { studentId: userId, assignment: { courseId } },
      select: { assignmentId: true, status: true, score: true },
    });
    mySubmissions = Object.fromEntries(subs.map(s => [s.assignmentId, { status: s.status, score: s.score }]));
  }

  return NextResponse.json({ assignments, mySubmissions });
}

// POST /api/courses/[id]/assignments
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

  const { title, instructions, moduleId, attachmentUrl, dueAt, maxPoints, isPublished } = parsed.data;

  const assignment = await prisma.assignment.create({
    data: {
      courseId,
      moduleId: moduleId || null,
      title,
      instructions,
      attachmentUrl: attachmentUrl || null,
      dueAt: dueAt ? new Date(dueAt) : null,
      maxPoints,
      isPublished,
      createdById: session.user.id,
    },
    include: {
      module: { select: { id: true, title: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { submissions: true } },
    },
  });

  return NextResponse.json({ assignment }, { status: 201 });
}
