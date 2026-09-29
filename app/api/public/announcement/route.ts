import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const announcement = await prisma.newsPost.findFirst({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    select: { id: true, title: true, body: true, pinned: true },
  });

  return NextResponse.json(
    { announcement },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" } }
  );
}
