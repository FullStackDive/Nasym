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

  // Cache only the un-queried list; searches stay fresh.
  const cacheHeader = q
    ? "private, no-store"
    : "public, max-age=60, s-maxage=180, stale-while-revalidate=600";

  return NextResponse.json({ lessons }, { headers: { "Cache-Control": cacheHeader } });
}
