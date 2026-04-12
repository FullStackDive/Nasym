import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";
import { userHasPermission } from "@/lib/permissions";
import { z } from "zod";

export async function GET() {
  const lessons = await prisma.lesson.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, title: true, description: true, videoUrl: true, tags: true, createdAt: true }
  });
  return NextResponse.json({ lessons });
}

const schema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  videoUrl: z.string().min(5).max(500).refine((v) => v.startsWith("http"), "Must be a URL (use embed URL)"),
  tags: z.string().max(200).optional()
});

export async function POST(req: Request) {
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });

  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_lessons" as any);
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const lesson = await prisma.lesson.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      videoUrl: parsed.data.videoUrl,
      tags: parsed.data.tags,
      createdById: session.user.id
    },
    select: { id: true, title: true, description: true, videoUrl: true, tags: true, createdAt: true }
  });

  return NextResponse.json({ lesson });
}
