import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher, isCourseEnrolled } from "@/lib/access";
import { getYouTubeVideoId } from "@/lib/youtube";

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

// GET /api/courses/[id]/recordings
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

  const recordings = await prisma.recording.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: { id: true, name: true } },
      classSession: { select: { id: true, title: true, scheduledAt: true } },
    },
  });

  return NextResponse.json({ recordings });
}

// POST /api/courses/[id]/recordings — multipart video upload or external URL
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;
  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "For now, add class recordings with an Unlisted YouTube link." },
      { status: 415 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.videoUrl) {
    return NextResponse.json({ error: "title and videoUrl are required" }, { status: 400 });
  }

  const title = String(body.title).trim();
  const description = body.description ? String(body.description).trim() : null;
  const videoUrl = String(body.videoUrl).trim();
  const classSessionId = body.classSessionId ? String(body.classSessionId).trim() : null;

  if (!getYouTubeVideoId(videoUrl)) {
    return NextResponse.json(
      { error: "Please paste a valid YouTube video link." },
      { status: 400 }
    );
  }

  if (classSessionId) {
    const classSession = await prisma.classSession.findFirst({
      where: { id: classSessionId, courseId },
      select: { id: true },
    });
    if (!classSession) {
      return NextResponse.json(
        { error: "Selected class session does not belong to this course." },
        { status: 400 }
      );
    }
  }

  const recording = await prisma.recording.create({
    data: {
      courseId,
      classSessionId,
      title,
      description,
      videoUrl,
      durationSec: null,
      uploadedById: session.user.id,
    },
    include: {
      uploadedBy: { select: { id: true, name: true } },
      classSession: { select: { id: true, title: true, scheduledAt: true } },
    },
  });

  return NextResponse.json({ recording }, { status: 201 });
}
