import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";

export async function GET() {
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const progress = await prisma.lessonProgress.findMany({
    where: { userId: session.user.id },
    select: { lessonId: true, completedAt: true },
    orderBy: { completedAt: "desc" }
  });

  return NextResponse.json({ progress });
}
