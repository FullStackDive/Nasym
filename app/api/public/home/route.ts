import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const posters = await prisma.poster.findMany({
    orderBy: { createdAt: "desc" },
    take: 6
  });

  const news = await prisma.newsPost.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 8
  });

  const upcomingClasses = await prisma.classSession.findMany({
    where: { scheduledAt: { gte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    take: 6,
    select: { id: true, title: true, description: true, scheduledAt: true, isLive: true }
  });

  return NextResponse.json({ posters, news, upcomingClasses });
}
