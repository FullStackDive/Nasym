import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const classes = await prisma.classSession.findMany({
    orderBy: [{ isLive: "desc" }, { scheduledAt: "asc" }],
    take: 50,
    select: { id: true, title: true, description: true, scheduledAt: true, isLive: true }
  });
  return NextResponse.json(
    { classes },
    { headers: { "Cache-Control": "public, max-age=20, s-maxage=60, stale-while-revalidate=300" } }
  );
}
