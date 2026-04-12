import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/server-session";
import { userHasPermission } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3).max(120),
  body: z.string().min(10).max(5000),
  pinned: z.boolean().default(false)
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_news");
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const post = await prisma.newsPost.findUnique({
    where: { id },
    select: { id: true, title: true, body: true, pinned: true, createdAt: true }
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ post });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_news");
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const post = await prisma.newsPost.update({
    where: { id },
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      pinned: parsed.data.pinned
    },
    select: { id: true, title: true, body: true, pinned: true, createdAt: true }
  });

  return NextResponse.json({ post });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_news");
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.newsPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
