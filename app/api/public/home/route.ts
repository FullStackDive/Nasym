import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public, anonymous content. Safe to cache briefly at the edge / CDN.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  // DATABASE_URL is intentionally capped at one pooled connection per
  // serverless instance. Run the small homepage queries sequentially instead
  // of making them compete for that single connection.
  const posters = await prisma.poster.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const news = await prisma.newsPost.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 8,
  });

  const upcomingClasses = await prisma.classSession.findMany({
    where: { scheduledAt: { gte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    take: 6,
    select: { id: true, title: true, description: true, scheduledAt: true, isLive: true },
  });

  const posts = await prisma.blogPost.findMany({
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
  });

  return NextResponse.json(
    { posters, news, upcomingClasses, posts },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" } }
  );
}
