import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher } from "@/lib/access";

// Vercel function body limit ~4.5 MB. Cap accordingly; for bigger files,
// teachers should host externally and use a URL-based material flow (TODO).
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/markdown",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

async function canView(userId: string, role: string, courseId: string) {
  if (role === "ADMIN" || role === "TEACHER") return canEdit(userId, role, courseId);
  const enrolment = await prisma.courseEnrolment.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });
  return !!enrolment && enrolment.status === "ACTIVE";
}

// GET /api/courses/[id]/materials
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;

  if (!(await canView(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const moduleId = url.searchParams.get("moduleId");

  const materials = await prisma.courseMaterial.findMany({
    where: {
      courseId,
      ...(moduleId ? { moduleId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ materials });
}

// POST /api/courses/[id]/materials — multipart form upload
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;

  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim();
  const moduleId = (formData.get("moduleId") as string | null) || null;

  if (!file || !title) {
    return NextResponse.json({ error: "file and title are required" }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "Title too long (max 200 chars)" }, { status: 400 });
  }
  if (description && description.length > 2000) {
    return NextResponse.json({ error: "Description too long (max 2000 chars)" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File too large (max 4 MB on free tier)" }, { status: 413 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 415 });
  }

  const ext = path.extname(file.name) || "";
  const safeName = `materials/${courseId}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

  let fileUrl: string;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(safeName, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });
    fileUrl = blob.url;
  } else {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const localName = path.basename(safeName);
    await writeFile(path.join(uploadsDir, localName), Buffer.from(await file.arrayBuffer()));
    fileUrl = `/uploads/${localName}`;
  }

  const material = await prisma.courseMaterial.create({
    data: {
      courseId,
      moduleId: moduleId || null,
      title,
      description: description || null,
      fileUrl,
      fileType: file.type || null,
      uploadedById: session.user.id,
    },
    include: { uploadedBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ material }, { status: 201 });
}
