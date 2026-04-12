import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";
import { z } from "zod";

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET() {
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const date = todayString();
  const record = await prisma.habitLog.findUnique({
    where: { userId_date: { userId: session.user.id, date } }
  });

  return NextResponse.json({ habits: (record?.habits ?? {}) as Record<string, boolean>, date });
}

const schema = z.object({
  habits: z.record(z.string(), z.boolean())
});

export async function PUT(req: Request) {
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const date = todayString();
  const userId = session.user.id;

  await prisma.habitLog.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, habits: parsed.data.habits },
    update: { habits: parsed.data.habits }
  });

  return NextResponse.json({ ok: true });
}
