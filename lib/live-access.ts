import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseEnrolled, isCourseTeacher } from "@/lib/access";

export type ResolvedRoom = {
  classSession: {
    id: string;
    roomName: string;
    courseId: string | null;
    createdById: string;
    isLive: boolean;
    title: string;
  };
  user: { id: string; name: string | null; email: string | null; role: string };
  isMod: boolean;
};

export async function resolveRoomAccess(
  roomName: string
): Promise<ResolvedRoom | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cs = await prisma.classSession.findUnique({
    where: { roomName },
    select: {
      id: true,
      roomName: true,
      courseId: true,
      createdById: true,
      isLive: true,
      title: true,
    },
  });
  if (!cs) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const { role, id: userId } = session.user;
  const isCreator = cs.createdById === userId;
  let allowed = role === "ADMIN" || isCreator;
  let isMod = role === "ADMIN" || role === "TEACHER" || isCreator;

  if (!allowed) {
    if (cs.courseId) {
      if (role === "TEACHER" && (await isCourseTeacher(userId, cs.courseId))) {
        allowed = true;
        isMod = true;
      } else if (await isCourseEnrolled(userId, cs.courseId)) {
        allowed = true;
      }
    } else {
      // No courseId → open to any logged-in user (public/admin-created session).
      allowed = true;
    }
  }

  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return {
    classSession: cs,
    user: { id: userId, name: session.user.name ?? null, email: session.user.email ?? null, role },
    isMod,
  };
}
