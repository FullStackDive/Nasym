import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/server-session";
import { userHasPermission } from "@/lib/permissions";
import { z } from "zod";

export async function GET() {
  const posters = await prisma.poster.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, title: true, imageUrl: true, ctaText: true, ctaHref: true, createdAt: true }
  });
  return NextResponse.json({ posters });
}

const schema = z.object({
  title: z.string().min(3).max(120),
  imageUrl: z.string().url(),
  ctaText: z.string().min(2).max(40).optional(),
  ctaHref: z.string().min(1).max(200).optional()
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_posters");
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const poster = await prisma.poster.create({
    data: {
      title: parsed.data.title,
      imageUrl: parsed.data.imageUrl,
      ctaText: parsed.data.ctaText,
      ctaHref: parsed.data.ctaHref,
      createdById: session.user.id
    },
    select: { id: true, title: true, imageUrl: true, ctaText: true, ctaHref: true, createdAt: true }
  });

  return NextResponse.json({ poster });
}
