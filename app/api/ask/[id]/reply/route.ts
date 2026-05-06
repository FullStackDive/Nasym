import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { id: string };

const replySchema = z.object({
  body: z.string().min(1).max(5000),
});

// POST /api/ask/[id]/reply — admin replies to a question
export async function POST(req: Request, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const reply = await prisma.questionReply.create({
    data: { questionId: id, body: parsed.data.body, authorId: session.user.id },
    include: { author: { select: { id: true, name: true } } },
  });

  // Mark as answered
  await prisma.question.update({ where: { id }, data: { status: "ANSWERED" } });

  return NextResponse.json({ reply }, { status: 201 });
}
