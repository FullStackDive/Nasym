import { NextResponse } from "next/server";
import { createReadStream, statSync } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher, isCourseEnrolled } from "@/lib/access";
import { Readable } from "stream";

// GET /api/recordings/[id]/stream
// Enforces: enrolled student OR course teacher OR admin. Supports HTTP Range.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const { role, id: userId } = session.user;

  const recording = await prisma.recording.findUnique({ where: { id } });
  if (!recording) return new NextResponse("Not found", { status: 404 });

  // Access check
  if (role !== "ADMIN") {
    const allowed =
      (role === "TEACHER" && await isCourseTeacher(userId, recording.courseId)) ||
      await isCourseEnrolled(userId, recording.courseId);
    if (!allowed) return new NextResponse("Forbidden", { status: 403 });
  }

  // External URL — redirect (embed or direct link from external host)
  if (!recording.videoUrl.startsWith("private:recordings/")) {
    return NextResponse.redirect(recording.videoUrl);
  }

  // Private file streaming with Range support
  const filename = recording.videoUrl.replace("private:recordings/", "");
  const filePath = path.join(process.cwd(), "private", "recordings", filename);

  let stat: ReturnType<typeof statSync>;
  try {
    stat = statSync(filePath);
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }

  const fileSize = stat.size;
  const rangeHeader = req.headers.get("range");

  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogg": "video/ogg",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
  };
  const contentType = mimeMap[ext] ?? "video/mp4";

  if (rangeHeader) {
    const [startStr, endStr] = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : Math.min(start + 1024 * 1024 - 1, fileSize - 1);

    if (start >= fileSize || end >= fileSize || start > end) {
      return new NextResponse("Range Not Satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${fileSize}` },
      });
    }

    const chunkSize = end - start + 1;
    const stream = createReadStream(filePath, { start, end });
    const webStream = Readable.toWeb(stream) as ReadableStream;

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  }

  // Full file
  const stream = createReadStream(filePath);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Length": String(fileSize),
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    },
  });
}
