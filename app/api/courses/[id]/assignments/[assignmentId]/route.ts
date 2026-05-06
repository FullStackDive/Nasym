import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher, isCourseEnrolled } from "@/lib/access";

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  instructions: z.string().min(1).max(10000).optional(),
  moduleId: z.string().nullable().optional(),
  attachmentUrl: z.string().url().optional().or(z.literal("")).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  maxPoints: z.number().int().min(1).max(1000).optional(),
  isPublished: z.boolean().optional(),
});

type Params = { id: string; assignmentId: string };

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

// GET /api/courses/[id]/assignments/[assignmentId]
export async function GET(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, assignmentId } = await params;
  const { role, id: userId } = session.user;

  const canManage = await canEdit(userId, role, courseId);
  if (!canManage) {
    const enrolled = await isCourseEnrolled(userId, courseId);
    if (!enrolled) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, courseId },
    include: {
      module: { select: { id: true, title: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { submissions: true } },
    },
  });

  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  if (!canManage && !assignment.isPublished) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Attach student's own submission if applicable
  let mySubmission = null;
  if (role === "STUDENT") {
    mySubmission = await prisma.assignmentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: userId } },
    });
  }

  return NextResponse.json({ assignment, mySubmission });
}

// PATCH /api/courses/[id]/assignments/[assignmentId]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, assignmentId } = await params;

  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignment = await prisma.assignment.findFirst({ where: { id: assignmentId, courseId } });
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      ...(d.title !== undefined && { title: d.title }),
      ...(d.instructions !== undefined && { instructions: d.instructions }),
      ...(d.moduleId !== undefined && { moduleId: d.moduleId }),
      ...(d.attachmentUrl !== undefined && { attachmentUrl: d.attachmentUrl || null }),
      ...(d.dueAt !== undefined && { dueAt: d.dueAt ? new Date(d.dueAt) : null }),
      ...(d.maxPoints !== undefined && { maxPoints: d.maxPoints }),
      ...(d.isPublished !== undefined && { isPublished: d.isPublished }),
    },
    include: {
      module: { select: { id: true, title: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { submissions: true } },
    },
  });

  return NextResponse.json({ assignment: updated });
}

// DELETE /api/courses/[id]/assignments/[assignmentId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, assignmentId } = await params;

  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignment = await prisma.assignment.findFirst({ where: { id: assignmentId, courseId } });
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  await prisma.assignment.delete({ where: { id: assignmentId } });
  return NextResponse.json({ ok: true });
}
