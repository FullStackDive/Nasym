import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher, isCourseEnrolled } from "@/lib/access";

const createSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(1).max(2000),
  scheduledAt: z.string().datetime(),
  // roomName auto-generated if not provided
  roomName: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Room name: lowercase letters, numbers, hyphens only").optional(),
});

function slugify(title: string) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

// GET /api/courses/[id]/sessions
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;
  const { role, id: userId } = session.user;

  const manage = await canEdit(userId, role, courseId);
  if (!manage) {
    const enrolled = await isCourseEnrolled(userId, courseId);
    if (!enrolled) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sessions = await prisma.classSession.findMany({
    where: { courseId },
    orderBy: { scheduledAt: "asc" },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ sessions });
}

// POST /api/courses/[id]/sessions
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

  let roomName = parsed.data.roomName ?? `${slugify(parsed.data.title)}-${Date.now()}`;
  // Ensure uniqueness
  const exists = await prisma.classSession.findUnique({ where: { roomName } });
  if (exists) roomName = `${roomName}-${Math.random().toString(36).slice(2, 6)}`;

  const classSession = await prisma.classSession.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      scheduledAt: new Date(parsed.data.scheduledAt),
      roomName,
      courseId,
      createdById: session.user.id,
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ session: classSession }, { status: 201 });
}
