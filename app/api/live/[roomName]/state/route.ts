import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveRoomAccess } from "@/lib/live-access";

const schema = z.object({ isLive: z.boolean() });

// PATCH /api/live/[roomName]/state — toggle live state (mod only)
export async function PATCH(req: Request, { params }: { params: Promise<{ roomName: string }> }) {
  const { roomName } = await params;
  const access = await resolveRoomAccess(roomName);
  if (access instanceof NextResponse) return access;
  if (!access.isMod) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const updated = await prisma.classSession.update({
    where: { id: access.classSession.id },
    data: { isLive: parsed.data.isLive },
    select: { id: true, isLive: true },
  });

  return NextResponse.json({ session: updated });
}
