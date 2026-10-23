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

  // Consistent branding, one clearly labeled action and a matching plain-text
  // alternative reduce ambiguity for recipients and email-filtering systems.
  // Never insert a user-controlled name into raw HTML.
  const delivered = await sendEmail({
    to: user.email,
    subject: "Reset your Nasym-Ur-Rahmah Institute password",
    html: `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:#f7faf9;font-family:Arial,Helvetica,sans-serif;color:#243b42;">
  <div style="max-width:560px;margin:0 auto;padding:28px 26px;background:#ffffff;border:1px solid #e0e9e8;border-radius:12px;">
    <p style="margin:0 0 18px;color:#287b80;font-size:14px;font-weight:bold;">Nasym-Ur-Rahmah Institute</p>
    <h1 style="margin:0 0 20px;font-size:24px;font-weight:600;line-height:1.4;color:#203e47;">Reset your password</h1>
    <p style="font-size:15px;line-height:1.7;">Assalamu alaikum,</p>
    <p style="font-size:15px;line-height:1.7;">We received a request to reset the password for your Nasym-Ur-Rahmah Institute account.</p>
    <p style="margin:24px 0;"><a href="${resetUrl}" style="display:inline-block;padding:13px 22px;background:#205b65;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;border-radius:7px;">Reset password</a></p>
    <p style="font-size:14px;line-height:1.7;">This link is valid for one hour and can only be used once.</p>
    <p style="font-size:14px;line-height:1.7;">If you did not request a password reset, you can safely ignore this message. Your password will remain unchanged.</p>
    <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e0e9e8;color:#60757c;font-size:12px;">Nasym-Ur-Rahmah Institute · nasymurrahmah.com</p>
  </div>
</body>
</html>`,
    text: `Nasym-Ur-Rahmah Institute

Reset your password

Assalamu alaikum,

We received a request to reset the password for your Nasym-Ur-Rahmah Institute account.

Reset your password with this link (valid for one hour, one use):
${resetUrl}

If you did not request this, you can safely ignore this message. Your password will remain unchanged.

Nasym-Ur-Rahmah Institute · https://www.nasymurrahmah.com`,
  });
  if (!delivered) {
    await prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
    return NextResponse.json({ error: "Password reset emails are temporarily unavailable. Please try again later or contact the institute administrator." }, { status: 503 });
  }

  return generic;
}
