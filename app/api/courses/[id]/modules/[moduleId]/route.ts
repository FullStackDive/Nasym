import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher } from "@/lib/access";

const updateSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  summary: z.string().max(500).optional(),
  position: z.number().int().min(0).optional(),
});

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

// PATCH /api/courses/[id]/modules/[moduleId]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, moduleId } = await params;

  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mod = await prisma.module.findFirst({ where: { id: moduleId, courseId } });
  if (!mod) return NextResponse.json({ error: "Module not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.module.update({
    where: { id: moduleId },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.summary !== undefined && { summary: parsed.data.summary }),
      ...(parsed.data.position !== undefined && { position: parsed.data.position }),
    },
  });

  return NextResponse.json({ module: updated });
}

// DELETE /api/courses/[id]/modules/[moduleId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, moduleId } = await params;

  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mod = await prisma.module.findFirst({ where: { id: moduleId, courseId } });
  if (!mod) return NextResponse.json({ error: "Module not found" }, { status: 404 });

  await prisma.module.delete({ where: { id: moduleId } });
  return NextResponse.json({ ok: true });
}
