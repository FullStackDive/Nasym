import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher } from "@/lib/access";

async function canEdit(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;
  if (role === "TEACHER") return isCourseTeacher(userId, courseId);
  return false;
}

// DELETE /api/courses/[id]/materials/[materialId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, materialId } = await params;

  if (!(await canEdit(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const material = await prisma.courseMaterial.findFirst({
    where: { id: materialId, courseId },
  });
  if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });

  // Remove physical file: local disk OR Vercel Blob
  if (material.fileUrl.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", material.fileUrl);
    await unlink(filePath).catch(() => null);
  } else if (material.fileUrl.includes(".public.blob.vercel-storage.com")) {
    await del(material.fileUrl).catch(() => null);
  }

  await prisma.courseMaterial.delete({ where: { id: materialId } });
  return NextResponse.json({ ok: true });
}
