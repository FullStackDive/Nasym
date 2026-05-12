import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveRoomAccess } from "@/lib/live-access";

const postSchema = z.object({
  body: z.string().min(1).max(2000),
});

// GET /api/live/[roomName]/messages?since=<iso>
export async function GET(req: Request, { params }: { params: Promise<{ roomName: string }> }) {
  const { roomName } = await params;
  const access = await resolveRoomAccess(roomName);
  if (access instanceof NextResponse) return access;

  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : null;

  const messages = await prisma.liveMessage.findMany({
    where: {
      classSessionId: access.classSession.id,
      ...(since && !Number.isNaN(since.getTime()) ? { createdAt: { gt: since } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { id: true, name: true, role: true } },
    },
  });

  return NextResponse.json({ messages });
}

// POST /api/live/[roomName]/messages
export async function POST(req: Request, { params }: { params: Promise<{ roomName: string }> }) {
  const { roomName } = await params;
  const access = await resolveRoomAccess(roomName);
  if (access instanceof NextResponse) return access;

  const data = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const msg = await prisma.liveMessage.create({
    data: {
      classSessionId: access.classSession.id,
      userId: access.user.id,
      body: parsed.data.body.trim(),
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { id: true, name: true, role: true } },
    },
  });

  return NextResponse.json({ message: msg }, { status: 201 });
}
