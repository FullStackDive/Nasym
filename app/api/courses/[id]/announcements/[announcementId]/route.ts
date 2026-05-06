import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher } from "@/lib/access";

const patchSchema = z.object({
  body: z.string().min(1).max(5000).optional(),
  pinned: z.boolean().optional(),
});

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

// PATCH /api/courses/[id]/announcements/[announcementId]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, announcementId } = await params;

  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ann = await prisma.announcement.findFirst({ where: { id: announcementId, courseId } });
  if (!ann) return NextResponse.json({ error: "Announcement not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      ...(parsed.data.body !== undefined && { body: parsed.data.body }),
      ...(parsed.data.pinned !== undefined && { pinned: parsed.data.pinned }),
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ announcement: updated });
}

// DELETE /api/courses/[id]/announcements/[announcementId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, announcementId } = await params;

  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ann = await prisma.announcement.findFirst({ where: { id: announcementId, courseId } });
  if (!ann) return NextResponse.json({ error: "Announcement not found" }, { status: 404 });

  await prisma.announcement.delete({ where: { id: announcementId } });
  return NextResponse.json({ ok: true });
}
