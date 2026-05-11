import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const { commentId } = await params;
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const comment = await prisma.lessonComment.findUnique({ where: { id: commentId }, select: { userId: true } });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role !== "ADMIN" && comment.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.lessonComment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
