import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/server-session";
import { userHasPermission } from "@/lib/permissions";
import { z } from "zod";

export async function GET() {
  const posts = await prisma.newsPost.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 100,
    select: { id: true, title: true, body: true, pinned: true, createdAt: true }
  });
  return NextResponse.json({ posts });
}

const schema = z.object({
  title: z.string().min(3).max(120),
  body: z.string().min(10).max(5000),
  pinned: z.boolean().default(false)
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_news");
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const post = await prisma.newsPost.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      pinned: parsed.data.pinned,
      createdById: session.user.id
    },
    select: { id: true, title: true, body: true, pinned: true, createdAt: true }
  });
  return NextResponse.json({ post });
}
