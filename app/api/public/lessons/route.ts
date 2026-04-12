import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";

  const lessons = await prisma.lesson.findMany({
    where: q ? {
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } }
      ]
    } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, title: true, description: true, videoUrl: true, tags: true, createdAt: true }
  });

  return NextResponse.json({ lessons });
}
