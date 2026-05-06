import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseEnrolled, isCourseTeacher } from "@/lib/access";

// GET /api/live/[roomName] — fetch a ClassSession by its Jitsi roomName
export async function GET(_req: Request, { params }: { params: Promise<{ roomName: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomName } = await params;

  const classSession = await prisma.classSession.findUnique({
    where: { roomName },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  if (!classSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const { role, id: userId } = session.user;

  // Admins and the session creator always have access
  if (role === "ADMIN" || classSession.createdById === userId) {
    return NextResponse.json({ session: classSession });
  }

  // Teachers assigned to the course can access
  if (role === "TEACHER" && classSession.courseId) {
    if (await isCourseTeacher(userId, classSession.courseId)) {
      return NextResponse.json({ session: classSession });
    }
  }

  // Enrolled students can access
  if (classSession.courseId) {
    if (await isCourseEnrolled(userId, classSession.courseId)) {
      return NextResponse.json({ session: classSession });
    }
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
