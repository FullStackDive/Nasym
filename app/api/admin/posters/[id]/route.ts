import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/server-session";
import { userHasPermission } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3).max(120),
  imageUrl: z.string().min(1).refine(
    (v) => v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://"),
    { message: "Must be a URL or a root-relative path" }
  ),
  ctaText: z.string().min(2).max(40).optional(),
  ctaHref: z.string().min(1).max(200).optional()
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_posters");
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const poster = await prisma.poster.findUnique({
    where: { id },
    select: { id: true, title: true, imageUrl: true, ctaText: true, ctaHref: true, createdAt: true }
  });
  if (!poster) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ poster });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_posters");
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const poster = await prisma.poster.update({
    where: { id },
    data: {
      title: parsed.data.title,
      imageUrl: parsed.data.imageUrl,
      ctaText: parsed.data.ctaText ?? null,
      ctaHref: parsed.data.ctaHref ?? null
    },
    select: { id: true, title: true, imageUrl: true, ctaText: true, ctaHref: true, createdAt: true }
  });

  return NextResponse.json({ poster });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_posters");
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.poster.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
