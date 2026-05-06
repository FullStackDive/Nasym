import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuestionStatus } from "@prisma/client";

const submitSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().min(2).max(200),
  body: z.string().min(10).max(5000),
});

// POST /api/ask — public question submission (no auth required)
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });

  const question = await prisma.question.create({ data: parsed.data });
  return NextResponse.json({ question }, { status: 201 });
}

// GET /api/ask — admin only: list all questions
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rawStatus = searchParams.get("status");
  const status = rawStatus && Object.values(QuestionStatus).includes(rawStatus as QuestionStatus)
    ? rawStatus as QuestionStatus
    : undefined;

  const questions = await prisma.question.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: { replies: { include: { author: { select: { id: true, name: true } } }, orderBy: { sentAt: "asc" } } },
  });

  return NextResponse.json({ questions });
}
