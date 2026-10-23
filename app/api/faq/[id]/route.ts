import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const schema = z.object({
  question: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(5).max(5000),
  category: z.enum(["GENERAL", "COURSES", "REGISTRATION", "RECORDINGS"]),
  position: z.number().int().min(0).max(10000),
});

type Context = { params: Promise<{ id: string }> };
async function authorized() {
  const session = await getServerSession(authOptions);
  return session?.user.role === "ADMIN" ? 200 : session ? 403 : 401;
}

export async function PATCH(req: Request, { params }: Context) {
  const auth = await authorized();
  if (auth !== 200) return NextResponse.json({ error: auth === 401 ? "Unauthorized" : "Forbidden" }, { status: auth });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid FAQ fields" }, { status: 400 });
  const { id } = await params;
  const existing = await prisma.faqEntry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
  const entry = await prisma.faqEntry.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ entry });
}

export async function DELETE(_req: Request, { params }: Context) {
  const auth = await authorized();
  if (auth !== 200) return NextResponse.json({ error: auth === 401 ? "Unauthorized" : "Forbidden" }, { status: auth });
  const { id } = await params;
  const deleted = await prisma.faqEntry.deleteMany({ where: { id } });
  if (deleted.count === 0) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
