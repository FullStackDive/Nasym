import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher } from "@/lib/access";

const createSchema = z.object({
  title: z.string().min(2).max(120),
  summary: z.string().max(500).optional(),
  position: z.number().int().min(0).optional(),
});

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

// GET /api/courses/[id]/modules
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;

  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { position: "asc" },
    include: {
      _count: { select: { materials: true, assignments: true, quizzes: true } },
    },
  });

  return NextResponse.json({ modules });
}

// POST /api/courses/[id]/modules
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

  // Default position to end
  let position = parsed.data.position;
  if (position === undefined) {
    const last = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    position = (last?.position ?? -1) + 1;
  }

  const module = await prisma.module.create({
    data: {
      courseId,
      title: parsed.data.title,
      summary: parsed.data.summary ?? null,
      position,
    },
    include: { _count: { select: { materials: true, assignments: true, quizzes: true } } },
  });

  return NextResponse.json({ module }, { status: 201 });
}
