import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole, isCourseTeacher } from "@/lib/access";

const updateSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(10).max(2000).optional(),
  coverUrl: z.string().url().optional().or(z.literal("")).optional(),
  isPublished: z.boolean().optional(),
  isOpenForEnrolment: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  enrolmentFormUrl: z.string().url().optional().or(z.literal("")).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

async function canViewCourse(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  const enrolment = await prisma.courseEnrolment.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });
  return !!enrolment && enrolment.status === "ACTIVE";
}

// GET /api/courses/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      teachers: { include: { user: { select: { id: true, name: true, email: true } } } },
      modules: { orderBy: { position: "asc" } },
      _count: { select: { enrolments: true, materials: true, announcements: true } },
    },
  });

  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const canView = await canViewCourse(session.user.id, session.user.role, id);
  if (!canView && !course.isPublished) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ course });
}

// PATCH /api/courses/[id] — update (ADMIN or course teacher)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { role, id: userId } = session.user;

  if (role !== "ADMIN" && !(await isCourseTeacher(userId, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const updated = await prisma.course.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.coverUrl !== undefined && { coverUrl: parsed.data.coverUrl || null }),
      ...(parsed.data.isPublished !== undefined && { isPublished: parsed.data.isPublished }),
      ...(parsed.data.isOpenForEnrolment !== undefined && { isOpenForEnrolment: parsed.data.isOpenForEnrolment }),
      ...(parsed.data.isArchived !== undefined && { isArchived: parsed.data.isArchived }),
      ...(parsed.data.enrolmentFormUrl !== undefined && { enrolmentFormUrl: parsed.data.enrolmentFormUrl || null }),
      ...(parsed.data.startsAt !== undefined && { startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null }),
      ...(parsed.data.endsAt !== undefined && { endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null }),
    },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { enrolments: true, modules: true } },
    },
  });

  return NextResponse.json({ course: updated });
}

// DELETE /api/courses/[id] — ADMIN only
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
