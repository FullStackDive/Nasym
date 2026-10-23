import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailDeliveryConfigured } from "@/lib/email";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "forgot"), { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  // Always return generic success to prevent email enumeration.
  const generic = NextResponse.json({
    message: "If an account exists for that email, a reset link has been sent.",
  });
  if (!parsed.success) return generic;

  // Configuration failure must be visible and identical for every email address.
  if (!emailDeliveryConfigured()) {
    console.error("[password-reset] SMTP delivery is not configured");
    return NextResponse.json({ error: "Password reset emails are temporarily unavailable. Please contact the institute administrator." }, { status: 503 });
  }

  const user = await prisma.user.findFirst({ where: { email: { equals: parsed.data.email, mode: "insensitive" } } });
  if (!user || user.status === "BANNED" || user.status === "REJECTED") return generic;

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  // A dedicated canonical HTTPS origin avoids broken links if NEXTAUTH_URL
  // points to an internal Railway host or to an older domain.
  const base = process.env.PASSWORD_RESET_BASE_URL ??
    process.env.NEXTAUTH_URL ?? "https://www.nasymurrahmah.com";
  const resetUrl = `${base}/auth/reset?token=${rawToken}`;

  await logAudit({
    actorId: user.id,
    action: "password.reset.request",
    targetType: "User",
    targetId: user.id,
  }, req);

  const delivered = await sendEmail({
    to: user.email,
    subject: "Nasym-ur-Rahmah — password reset",
    html: `
      <h2>Assalamu alaikum, ${user.name}</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour and can be used once.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });
  if (!delivered) {
    await prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
    return NextResponse.json({ error: "Password reset emails are temporarily unavailable. Please try again later or contact the institute administrator." }, { status: 503 });
  }

  return generic;
}
