import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";
import { z } from "zod";

const createSchema = z.object({
  targetType: z.enum(["LESSON", "QUIZ", "USER"]),
  lessonId: z.string().optional(),
  quizId: z.string().optional(),
  targetUserEmail: z.string().email().optional(),
  reason: z.string().min(3).max(200),
  details: z.string().max(2000).optional()
});

export async function GET() {
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const reports = await prisma.report.findMany({
    where: { reporterId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, targetType: true, reason: true, status: true, createdAt: true }
  });

  return NextResponse.json({ reports });
}

export async function POST(req: Request) {
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  let targetUserId: string | undefined = undefined;
  if (parsed.data.targetType === "USER") {
    if (!parsed.data.targetUserEmail) {
      return NextResponse.json({ error: "targetUserEmail required for USER reports" }, { status: 400 });
    }
    const u = await prisma.user.findUnique({ where: { email: parsed.data.targetUserEmail } });
    if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });
    targetUserId = u.id;
  }

  const report = await prisma.report.create({
    data: {
      targetType: parsed.data.targetType as any,
      lessonId: parsed.data.lessonId,
      quizId: parsed.data.quizId,
      targetUserId,
      reason: parsed.data.reason,
      details: parsed.data.details,
      reporterId: session.user.id
    },
    select: { id: true }
  });

  return NextResponse.json({ report });
}
