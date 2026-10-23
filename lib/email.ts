import nodemailer from "nodemailer";

let _transporter: nodemailer.Transporter | null = null;

// Railway Free, Trial and Hobby plans cannot reach outbound SMTP ports.
// Prefer Resend's HTTPS API whenever a verified sender and API key are configured.
export function emailDeliveryConfigured(): boolean {
  const viaResend = Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
  const viaSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  return viaResend || viaSmtp;
}

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (_transporter) return _transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error("No production email provider configured");
    }
    const account = await nodemailer.createTestAccount();
    console.log("[email] Development-only Ethereal inbox configured.");
    _transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: account.user, pass: account.pass },
    });
  }

  return _transporter;
}

type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

async function sendViaResend(message: EmailMessage): Promise<boolean> {
  const token = process.env.RESEND_API_KEY?.trim();
  const sender = process.env.RESEND_FROM_EMAIL?.trim();
  if (!token || !sender) {
    console.error("[email] RESEND_API_KEY and RESEND_FROM_EMAIL are both required.");
    return false;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        ...(message.text ? { text: message.text } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      // Deliberately don't log request bodies, email addresses, tokens, or
      // provider response bodies (they might contain user information).
      console.error("[email] Resend API rejected a message (HTTP " + response.status + ").");
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Resend HTTP request failed:", err instanceof Error ? err.name : "unknown error");
    return false;
  }
}

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  // HTTPS works on all Railway plans, unlike outbound SMTP.
  if (process.env.RESEND_API_KEY?.trim()) return sendViaResend(message);

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "Nasym-ur-Rahmah <no-reply@nasym-ur-rahmah.local>",
      ...message,
    });
    if (!process.env.SMTP_USER) {
      console.log("[email] Development preview URL:", nodemailer.getTestMessageUrl(info));
    }
    return true;
  } catch (err) {
    console.error("[email] SMTP send failed:", err instanceof Error ? err.name : "unknown error");
    return false;
  }
}
