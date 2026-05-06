import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const acceptSchema = z.object({
  name: z.string().min(2).max(60),
  password: z.string().min(6).max(100),
});

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json().catch(() => null);
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const inv = await prisma.invitation.findUnique({ where: { token } });
  if (!inv) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  if (inv.status !== "PENDING") {
    return NextResponse.json({ error: `Invitation already ${inv.status.toLowerCase()}` }, { status: 410 });
  }
  if (inv.expiresAt.getTime() < Date.now()) {
    await prisma.invitation.update({ where: { id: inv.id }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "Invitation expired" }, { status: 410 });
  }

  const existing = await prisma.user.findUnique({ where: { email: inv.email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  // One transaction: create user, link to course (if any), mark invitation accepted.
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.data.name,
        email: inv.email,
        passwordHash,
        role: inv.role,
        status: "ACTIVE",
        approvedAt: new Date(),
        approvedById: inv.createdById,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    if (inv.courseId) {
      if (inv.role === "STUDENT") {
        await tx.courseEnrolment.create({
          data: { courseId: inv.courseId, userId: user.id, status: "ACTIVE" },
        });
      } else if (inv.role === "TEACHER") {
        await tx.courseTeacher.create({
          data: { courseId: inv.courseId, userId: user.id },
        });
      }
    }

    await tx.invitation.update({
      where: { id: inv.id },
      data: { status: "ACCEPTED", acceptedAt: new Date(), acceptedUserId: user.id },
    });

    return user;
  });

  return NextResponse.json({ user: result, message: "Account created. You can now sign in." });
}
