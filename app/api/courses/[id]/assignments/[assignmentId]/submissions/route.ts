import { NextResponse } from "next/server";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher, isCourseEnrolled } from "@/lib/access";

const MAX_FILE_BYTES = 4 * 1024 * 1024; // Vercel function body limit

type Params = { id: string; assignmentId: string };

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

// GET /api/courses/[id]/assignments/[assignmentId]/submissions
// Teachers/admins: all submissions. Students: own only.
export async function GET(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, assignmentId } = await params;
  const { role, id: userId } = session.user;

  if (role === "STUDENT") {
    const sub = await prisma.assignmentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: userId } },
      include: { gradedBy: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ submissions: sub ? [sub] : [] });
  }

  if (!(await canEdit(userId, role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    include: {
      student: { select: { id: true, name: true, email: true } },
      gradedBy: { select: { id: true, name: true } },
    },
    orderBy: { submittedAt: "asc" },
  });

  return NextResponse.json({ submissions });
}

// POST /api/courses/[id]/assignments/[assignmentId]/submissions — student submits
export async function POST(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, assignmentId } = await params;
  const { role, id: userId } = session.user;

  if (role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can submit assignments" }, { status: 403 });
  }

  const enrolled = await isCourseEnrolled(userId, courseId);
  if (!enrolled) return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, courseId, isPublished: true },
  });
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  const existing = await prisma.assignmentSubmission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId: userId } },
  });
  if (existing) return NextResponse.json({ error: "You have already submitted this assignment" }, { status: 409 });

  // Determine if late
  const isLate = assignment.dueAt ? assignment.dueAt.getTime() < Date.now() : false;

  // Accept multipart (file) or JSON (text only)
  const contentType = req.headers.get("content-type") ?? "";
  let text: string | null = null;
  let fileUrl: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData().catch(() => null);
    if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

    const file = formData.get("file") as File | null;
    text = (formData.get("text") as string | null) || null;

    if (file) {
      if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "File too large (max 4 MB on free tier)" }, { status: 413 });
      const ext = path.extname(file.name) || "";
      const safeName = `submissions/${assignmentId}/${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(safeName, file, {
          access: "public",
          contentType: file.type || "application/octet-stream",
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
    }
  } else {
    const body = await req.json().catch(() => ({}));
    const parsed = z.object({ text: z.string().max(20000).optional() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    text = parsed.data.text ?? null;
  }

  if (!text && !fileUrl) {
    return NextResponse.json({ error: "Submission must include text or a file" }, { status: 400 });
  }

  const submission = await prisma.assignmentSubmission.create({
    data: {
      assignmentId,
      studentId: userId,
      text,
      fileUrl,
      status: isLate ? "LATE" : "SUBMITTED",
    },
  });

  return NextResponse.json({ submission }, { status: 201 });
}
