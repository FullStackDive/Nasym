import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher, isCourseEnrolled } from "@/lib/access";

// Vercel free serverless has ~4.5MB body limit; cap multipart uploads.
// For larger videos, use an external URL (YouTube/Vimeo unlisted).
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
const VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-matroska"]);

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
    include: { uploadedBy: { select: { id: true, name: true } } },
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
  let title: string, description: string | null, videoUrl: string, durationSec: number | null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData().catch(() => null);
    if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

    const file = formData.get("file") as File | null;
    title = ((formData.get("title") as string | null) ?? "").trim();
    description = ((formData.get("description") as string | null) ?? "").trim() || null;
    durationSec = formData.get("durationSec") ? parseInt(formData.get("durationSec") as string) : null;

    if (!file || !title) return NextResponse.json({ error: "file and title are required" }, { status: 400 });
    if (!VIDEO_MIME.has(file.type)) return NextResponse.json({ error: "Unsupported video format. Use MP4, WebM, or OGG." }, { status: 415 });
    if (file.size > MAX_VIDEO_BYTES) return NextResponse.json({ error: "File too large (max 2 GB)" }, { status: 413 });

    const ext = path.extname(file.name) || ".mp4";
    const safeName = `recordings/${courseId}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(safeName, file, {
        access: "public",
        contentType: file.type,
        addRandomSuffix: false,
      });
      videoUrl = blob.url;
    } else {
      const privateDir = path.join(process.cwd(), "private", "recordings");
      await mkdir(privateDir, { recursive: true });
      const localName = path.basename(safeName);
      await writeFile(path.join(privateDir, localName), Buffer.from(await file.arrayBuffer()));
      videoUrl = `private:recordings/${localName}`;
    }
  } else {
    // JSON body with external URL (e.g. YouTube embed, Vimeo)
    const body = await req.json().catch(() => null);
    if (!body?.title || !body?.videoUrl) {
      return NextResponse.json({ error: "title and videoUrl are required" }, { status: 400 });
    }
    title = String(body.title).trim();
    description = body.description ? String(body.description).trim() : null;
    videoUrl = String(body.videoUrl).trim();
    durationSec = body.durationSec ? parseInt(body.durationSec) : null;
  }

  const recording = await prisma.recording.create({
    data: {
      courseId,
      title,
      description,
      videoUrl,
      durationSec: durationSec || null,
      uploadedById: session.user.id,
    },
    include: { uploadedBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ recording }, { status: 201 });
}
