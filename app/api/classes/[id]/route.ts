import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/server-session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cls = await prisma.classSession.findUnique({
    where: { id },
    select: { id: true, title: true, description: true, scheduledAt: true, isLive: true, roomName: true }
  });

  if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ class: cls });
}
