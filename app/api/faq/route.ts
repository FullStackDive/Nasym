import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const faqInput = z.object({
  question: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(5).max(5000),
  category: z.enum(["GENERAL", "COURSES", "REGISTRATION", "RECORDINGS"]).default("GENERAL"),
  position: z.number().int().min(0).max(10000).default(0),
});

export async function GET() {
  const entries = await prisma.faqEntry.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ entries }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = faqInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please enter a valid question and answer.", issues: parsed.error.flatten() }, { status: 400 });
  const entry = await prisma.faqEntry.create({ data: parsed.data });
  return NextResponse.json({ entry }, { status: 201 });
}
