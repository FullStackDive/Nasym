import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().min(2).max(300),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only").optional(),
  excerpt: z.string().max(500).optional(),
  body: z.string().min(1),
  coverUrl: z.string().url().optional(),
  isPublished: z.boolean().optional(),
});

function slugify(title: string) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// GET /api/blog — public list (published only for unauthed; all for admin/teacher)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const canSeeAll = role === "ADMIN" || role === "TEACHER";

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;

  const where = canSeeAll ? {} : { isPublished: true };

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: [{ isPublished: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: { author: { select: { id: true, name: true } } },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, pages: Math.ceil(total / limit) });
}

// POST /api/blog — admin or teacher creates post
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  let slug = d.slug ?? slugify(d.title);
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const post = await prisma.blogPost.create({
    data: {
      title: d.title,
      slug,
      excerpt: d.excerpt,
      body: d.body,
      coverUrl: d.coverUrl,
      isPublished: d.isPublished ?? false,
      publishedAt: d.isPublished ? new Date() : null,
      authorId: session.user.id,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ post }, { status: 201 });
}
