import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

/**
 * Public registration endpoint.
 * Per spec: NO open public student registration.
 * This endpoint creates a PENDING_APPROVAL user — admin must approve before login.
 * For invitation-based signup, use POST /api/invitations/[token]/accept (instant ACTIVE).
 */
const schema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(100)
});

export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "register"), { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const email = parsed.data.email;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      role: "STUDENT",
      status: "PENDING_APPROVAL"
    },
    select: { id: true, name: true, email: true, role: true, status: true }
  });

  void sendEmail({
    to: user.email,
    subject: "Nasym-ur-Rahmah — sign-up received",
    html: `
      <h2>Assalamu alaikum, ${user.name}!</h2>
      <p>Your sign-up request has been received. An administrator will review and approve your account shortly.</p>
      <p>You will receive another email once your account is active. You can then sign in normally.</p>
    `
  });

  return NextResponse.json({
    user,
    message: "Account pending admin approval. You will receive an email when it is activated."
  });
}
