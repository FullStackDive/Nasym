import nodemailer from "nodemailer";

let _transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (_transporter) return _transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.ethereal.email",
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    const account = await nodemailer.createTestAccount();
    console.log("[email] No SMTP credentials — using Ethereal test account:", account.user);
    _transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: account.user, pass: account.pass }
    });
  }

  return _transporter;
}

export async function sendEmail({
  to,
  subject,
  html,
  text
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "Noor <no-reply@noor.local>",
      to,
      subject,
      html,
      text
    });
    if (!process.env.SMTP_USER) {
      console.log("[email] Preview URL:", nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error("[email] Send failed:", err);
  }
}
