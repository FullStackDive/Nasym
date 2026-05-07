import { prisma } from "@/lib/prisma";

type NotifyInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  href?: string;
  email?: { to: string; subject: string; text: string };
};

/**
 * Create an in-app notification for a user. If `email` is provided
 * and SMTP env vars are set, also dispatch an email (best-effort).
 */
export async function notify(input: NotifyInput) {
  const notif = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
    },
  });

  if (input.email) {
    sendEmail(input.email).catch(err => console.error("notify: email failed", err));
  }

  return notif;
}

export async function notifyMany(
  userIds: string[],
  data: Omit<NotifyInput, "userId">,
) {
  await prisma.notification.createMany({
    data: userIds.map(uid => ({
      userId: uid,
      type: data.type,
      title: data.title,
      body: data.body,
      href: data.href,
    })),
  });
}

export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  if (!process.env.SMTP_HOST) {
    console.log(`[email-stub] to=${to} subject="${subject}"`);
    return;
  }
  // Lazy-load nodemailer only if available
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "noreply@nasym.org",
      to, subject, text,
    });
  } catch (err) {
    console.error("notify: nodemailer not installed or send failed", err);
  }
}
