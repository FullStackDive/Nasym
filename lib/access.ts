import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    role: session.user.role,
  };
}

/**
 * Use inside route handlers:
 *   const auth = await requireSession();
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.user is typed
 */
export async function requireSession(): Promise<{ user: SessionUser } | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return { user };
}

export async function requireRole(role: Role): Promise<{ user: SessionUser } | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return { user };
}

export async function requireRoles(roles: Role[]): Promise<{ user: SessionUser } | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roles.includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return { user };
}

export async function isCourseTeacher(userId: string, courseId: string): Promise<boolean> {
  const hit = await prisma.courseTeacher.findUnique({
    where: { courseId_userId: { courseId, userId } },
    select: { id: true },
  });
  return !!hit;
}

export async function isCourseEnrolled(userId: string, courseId: string): Promise<boolean> {
  const hit = await prisma.courseEnrolment.findUnique({
    where: { courseId_userId: { courseId, userId } },
    select: { status: true },
  });
  return hit?.status === "ACTIVE" || hit?.status === "COMPLETED";
}
