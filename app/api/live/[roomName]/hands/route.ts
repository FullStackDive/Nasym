import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveRoomAccess } from "@/lib/live-access";

const postSchema = z.object({
  question: z.string().max(500).optional(),
});

const patchSchema = z.object({
  handId: z.string().min(1),
  lower: z.boolean().optional(),
});

// GET /api/live/[roomName]/hands — active raised hands
export async function GET(_req: Request, { params }: { params: Promise<{ roomName: string }> }) {
  const { roomName } = await params;
  const access = await resolveRoomAccess(roomName);
  if (access instanceof NextResponse) return access;

  const hands = await prisma.raisedHand.findMany({
    where: { classSessionId: access.classSession.id, loweredAt: null },
    orderBy: { raisedAt: "asc" },
    select: {
      id: true,
      raisedAt: true,
      question: true,
      user: { select: { id: true, name: true, role: true } },
    },
  });

  return NextResponse.json({ hands, isMod: access.isMod });
}

// POST — raise (or update) own hand
export async function POST(req: Request, { params }: { params: Promise<{ roomName: string }> }) {
  const { roomName } = await params;
  const access = await resolveRoomAccess(roomName);
  if (access instanceof NextResponse) return access;

  const data = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const hand = await prisma.raisedHand.upsert({
    where: {
      classSessionId_userId: {
        classSessionId: access.classSession.id,
        userId: access.user.id,
      },
    },
    create: {
      classSessionId: access.classSession.id,
      userId: access.user.id,
      question: parsed.data.question ?? null,
    },
    update: {
      raisedAt: new Date(),
      loweredAt: null,
      question: parsed.data.question ?? null,
    },
    select: { id: true, raisedAt: true, question: true },
  });

  return NextResponse.json({ hand });
}

// PATCH — lower a hand (self always; mods can lower any)
export async function PATCH(req: Request, { params }: { params: Promise<{ roomName: string }> }) {
  const { roomName } = await params;
  const access = await resolveRoomAccess(roomName);
  if (access instanceof NextResponse) return access;

  const data = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const hand = await prisma.raisedHand.findFirst({
    where: { id: parsed.data.handId, classSessionId: access.classSession.id },
    select: { id: true, userId: true },
  });
  if (!hand) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (hand.userId !== access.user.id && !access.isMod) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.raisedHand.update({
    where: { id: hand.id },
    data: { loweredAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
