import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendEmail } from "@/lib/email";

const schema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(6).max(100)
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: "STUDENT"
    },
    select: { id: true, name: true, email: true, role: true }
  });

  void sendEmail({
    to: user.email,
    subject: "Welcome to Noor — your account is ready",
    html: `
      <h2>Assalamu alaikum, ${user.name}!</h2>
      <p>Your Noor account has been created. You can now join live classes, watch lessons, and take quizzes.</p>
      <p><a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard">Go to your dashboard</a></p>
    `
  });

  return NextResponse.json({ user });
}
