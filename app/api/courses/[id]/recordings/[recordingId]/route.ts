import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher } from "@/lib/access";

type Params = { id: string; recordingId: string };

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

// DELETE /api/courses/[id]/recordings/[recordingId]
export async function DELETE(_req: Request, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, recordingId } = await params;
  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const recording = await prisma.recording.findFirst({ where: { id: recordingId, courseId } });
  if (!recording) return NextResponse.json({ error: "Recording not found" }, { status: 404 });

  if (recording.videoUrl.startsWith("private:recordings/")) {
    const filename = recording.videoUrl.replace("private:recordings/", "");
    const filePath = path.join(process.cwd(), "private", "recordings", filename);
    await unlink(filePath).catch(() => null);
  } else if (recording.videoUrl.includes(".public.blob.vercel-storage.com")) {
    await del(recording.videoUrl).catch(() => null);
  }

  await prisma.recording.delete({ where: { id: recordingId } });
  return NextResponse.json({ ok: true });
}
