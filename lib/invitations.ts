import { randomBytes } from "crypto";
import { sendEmail } from "@/lib/email";

export const INVITATION_EXPIRY_DAYS = 7;

export function generateInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

export function inviteAcceptUrl(token: string): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/auth/accept-invite/${token}`;
}

export async function sendInvitationEmail(opts: {
  to: string;
  recipientName?: string | null;
  inviterName: string;
  role: string;
  courseTitle?: string | null;
  token: string;
  expiresAt: Date;
}) {
  const url = inviteAcceptUrl(opts.token);
  const greeting = opts.recipientName ? `Assalamu alaikum, ${opts.recipientName}` : "Assalamu alaikum";
  const courseLine = opts.courseTitle
    ? `<p>You have been enrolled in <b>${opts.courseTitle}</b>.</p>`
    : "";

  await sendEmail({
    to: opts.to,
    subject: `You're invited to join Nasym-ur-Rahmah`,
    html: `
      <h2>${greeting},</h2>
      <p>${opts.inviterName} has invited you to join <b>Nasym-ur-Rahmah</b> as a <b>${opts.role.toLowerCase()}</b>.</p>
      ${courseLine}
      <p><a href="${url}" style="display:inline-block;padding:10px 18px;background:#285260;color:#fff;border-radius:999px;text-decoration:none;font-weight:600">Accept invitation</a></p>
      <p style="color:#7C8E94;font-size:12px">Or paste this link into your browser: ${url}</p>
      <p style="color:#7C8E94;font-size:12px">This invitation expires on ${opts.expiresAt.toUTCString()}.</p>
    `,
  });
}
