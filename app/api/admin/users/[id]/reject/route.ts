import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/access";

const rejectSchema = z.object({
  reason: z.string().max(500).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const parsed = rejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.status !== "PENDING_APPROVAL") {
    return NextResponse.json({ error: `User is already ${user.status.toLowerCase()}` }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      status: "REJECTED",
      statusReason: parsed.data.reason ?? null,
    },
    select: { id: true, status: true, statusReason: true },
  });

  return NextResponse.json({ user: updated });
}
