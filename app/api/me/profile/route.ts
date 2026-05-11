import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { DUAS } from "@/lib/duas";

const DUA_KEYS = DUAS.map(d => d.key) as [string, ...string[]];

export async function GET() {
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const [user, lessonsCompleted, quizzesTaken, scoreAgg] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, duaKey: true } }),
    prisma.lessonProgress.count({ where: { userId } }),
    prisma.quizAttempt.count({ where: { userId } }),
    prisma.quizAttempt.aggregate({ where: { userId }, _avg: { score: true } })
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    name: user.name,
    email: user.email,
    duaKey: user.duaKey ?? null,
    lessonsCompleted,
    quizzesTaken,
    avgScore: scoreAgg._avg.score ?? 0
  });
}

const schema = z
  .object({
    name: z.string().min(2).max(60).optional(),
    duaKey: z.enum(DUA_KEYS).nullable().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6).max(100).optional()
  })
  .refine(
    (d) => !d.newPassword || !!d.currentPassword,
    { message: "Current password is required to set a new password", path: ["currentPassword"] }
  );

export async function PUT(req: Request) {
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { name, duaKey, currentPassword, newPassword } = parsed.data;
  const updateData: { name?: string; passwordHash?: string; duaKey?: string | null } = {};

  if (name) updateData.name = name;
  if (duaKey !== undefined) updateData.duaKey = duaKey;

  if (newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true }
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const match = await bcrypt.compare(currentPassword!, user.passwordHash);
    if (!match) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

    updateData.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: session.user.id }, data: updateData });

  return NextResponse.json({ ok: true });
}
