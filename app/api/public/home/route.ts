import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public, anonymous content. Safe to cache briefly at the edge / CDN.
export const revalidate = 60;

export async function GET() {
  const [posters, news, upcomingClasses] = await Promise.all([
    prisma.poster.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.newsPost.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    prisma.classSession.findMany({
      where: { scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: 6,
      select: { id: true, title: true, description: true, scheduledAt: true, isLive: true },
    }),
  ]);

  return NextResponse.json(
    { posters, news, upcomingClasses },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" } }
  );
}
