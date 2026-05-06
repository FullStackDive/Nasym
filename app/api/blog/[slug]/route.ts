import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { slug: string };

const updateSchema = z.object({
  title: z.string().min(2).max(300).optional(),
  excerpt: z.string().max(500).optional(),
  body: z.string().min(1).optional(),
  coverUrl: z.string().url().optional().nullable(),
  isPublished: z.boolean().optional(),
});

// GET /api/blog/[slug] — public for published; admin/teacher sees drafts too
export async function GET(_req: Request, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const canSeeAll = role === "ADMIN" || role === "TEACHER";

  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { author: { select: { id: true, name: true } } },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!post.isPublished && !canSeeAll) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ post });
}

// PATCH /api/blog/[slug] — admin or post author (teacher)
export async function PATCH(req: Request, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { role, id: userId } = session.user;
  if (role !== "ADMIN" && post.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const d = parsed.data;
  const updated = await prisma.blogPost.update({
    where: { slug },
    data: {
      ...(d.title !== undefined && { title: d.title }),
      ...(d.excerpt !== undefined && { excerpt: d.excerpt }),
      ...(d.body !== undefined && { body: d.body }),
      ...(d.coverUrl !== undefined && { coverUrl: d.coverUrl }),
      ...(d.isPublished !== undefined && {
        isPublished: d.isPublished,
        publishedAt: d.isPublished && !post.publishedAt ? new Date() : post.publishedAt,
      }),
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ post: updated });
}

// DELETE /api/blog/[slug] — admin or post author
export async function DELETE(_req: Request, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { role, id: userId } = session.user;
  if (role !== "ADMIN" && post.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.blogPost.delete({ where: { slug } });
  return NextResponse.json({ ok: true });
}
