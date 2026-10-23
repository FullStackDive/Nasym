import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ayahOfTheDay } from "@/lib/ayahs";

export const dynamic = "force-dynamic";

export async function GET() {
  const saved = await prisma.featuredAyah.findUnique({ where: { id: "featured" } });
  const ayah = saved
    ? { arabic: saved.arabic, translit: saved.translit || "", meaning: saved.meaning, ref: saved.reference }
    : ayahOfTheDay();
  return NextResponse.json({ ayah, custom: Boolean(saved) }, { headers: { "Cache-Control": "no-store" } });
}
