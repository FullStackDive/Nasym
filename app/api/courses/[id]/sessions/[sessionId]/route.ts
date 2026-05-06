import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher } from "@/lib/access";

type Params = { id: string; sessionId: string };

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  scheduledAt: z.string().datetime().optional(),
  isLive: z.boolean().optional(),
});

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

// PATCH /api/courses/[id]/sessions/[sessionId]
export async function PATCH(req: Request, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, sessionId } = await params;
  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cs = await prisma.classSession.findFirst({ where: { id: sessionId, courseId } });
  if (!cs) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const d = parsed.data;
  const updated = await prisma.classSession.update({
    where: { id: sessionId },
    data: {
      ...(d.title !== undefined && { title: d.title }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.scheduledAt !== undefined && { scheduledAt: new Date(d.scheduledAt) }),
      ...(d.isLive !== undefined && { isLive: d.isLive }),
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ session: updated });
}

// DELETE /api/courses/[id]/sessions/[sessionId]
export async function DELETE(_req: Request, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, sessionId } = await params;
  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cs = await prisma.classSession.findFirst({ where: { id: sessionId, courseId } });
  if (!cs) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  await prisma.classSession.delete({ where: { id: sessionId } });
  return NextResponse.json({ ok: true });
}
