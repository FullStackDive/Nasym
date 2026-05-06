import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/access";
import {
  generateInvitationToken,
  INVITATION_EXPIRY_DAYS,
  sendInvitationEmail,
} from "@/lib/invitations";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80).optional(),
  role: z.enum(["STUDENT", "TEACHER", "PARENT", "ADMIN"]),
  courseId: z.string().cuid().optional(),
  expiresInDays: z.number().int().min(1).max(60).optional(),
});

export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      course: { select: { id: true, title: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ invitations });
}

export async function POST(req: Request) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  if (parsed.data.courseId) {
    const course = await prisma.course.findUnique({
      where: { id: parsed.data.courseId },
      select: { id: true, title: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
  }

  const token = generateInvitationToken();
  const days = parsed.data.expiresInDays ?? INVITATION_EXPIRY_DAYS;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const invitation = await prisma.invitation.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
      courseId: parsed.data.courseId,
      token,
      expiresAt,
      createdById: auth.user.id,
    },
    include: { course: { select: { title: true } } },
  });

  void sendInvitationEmail({
    to: invitation.email,
    recipientName: invitation.name,
    inviterName: auth.user.name ?? "An administrator",
    role: invitation.role,
    courseTitle: invitation.course?.title,
    token: invitation.token,
    expiresAt: invitation.expiresAt,
  });

  return NextResponse.json({ invitation }, { status: 201 });
}
