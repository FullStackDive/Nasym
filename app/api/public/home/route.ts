import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public, anonymous content. Safe to cache briefly at the edge / CDN.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const now = new Date();

  // These reads are independent and Railway's persistent Node service has a
  // small shared Prisma pool, so parallel execution reduces homepage latency.
  const [posters, news, upcomingClasses, posts] = await Promise.all([
    prisma.poster.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.newsPost.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    prisma.classSession.findMany({
      where: { scheduledAt: { gte: now } },
      orderBy: { scheduledAt: "asc" },
      take: 6,
      select: { id: true, title: true, description: true, scheduledAt: true, isLive: true },
    }),
    prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 6,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
      },
    }),
  ]);

  return NextResponse.json(
    { posters, news, upcomingClasses, posts },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" } }
  );
}
