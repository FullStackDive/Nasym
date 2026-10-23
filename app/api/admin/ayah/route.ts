import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { ayahOfTheDay } from "@/lib/ayahs";

const schema = z.object({
  arabic: z.string().trim().min(2).max(2000),
  translit: z.string().trim().max(2000).default(""),
  meaning: z.string().trim().min(2).max(4000),
  reference: z.string().trim().min(2).max(200),
});

async function authorized() {
  const session = await getServerSession(authOptions);
  return session?.user.role === "ADMIN" ? 200 : session ? 403 : 401;
}

export async function GET() {
  const auth = await authorized();
  if (auth !== 200) return NextResponse.json({ error: "Forbidden" }, { status: auth });
  const saved = await prisma.featuredAyah.findUnique({ where: { id: "featured" } });
  return NextResponse.json({ saved, suggested: ayahOfTheDay() }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: Request) {
  const auth = await authorized();
  if (auth !== 200) return NextResponse.json({ error: "Forbidden" }, { status: auth });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please complete the Arabic, translation and reference fields." }, { status: 400 });
  const saved = await prisma.featuredAyah.upsert({
    where: { id: "featured" },
    create: { id: "featured", ...parsed.data },
    update: parsed.data,
  });
  return NextResponse.json({ saved });
}

export async function DELETE() {
  const auth = await authorized();
  if (auth !== 200) return NextResponse.json({ error: "Forbidden" }, { status: auth });
  await prisma.featuredAyah.deleteMany({ where: { id: "featured" } });
  return NextResponse.json({ ok: true });
}
