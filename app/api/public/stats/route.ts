import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public aggregate counts; never expose users or other private records.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const [students, lessons] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.lesson.count(),
    ]);

    return NextResponse.json(
      { students, lessons },
      { headers: { "Cache-Control": "public, max-age=15, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    console.error("[public/stats] Failed to load counts", error);
    return NextResponse.json(
      { error: "Statistics temporarily unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
