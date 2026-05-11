import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  providers: [
    // Google — only enabled when env vars are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        // Google-only accounts have no password hash
        if (!user.passwordHash) throw new Error("ACCOUNT_USE_GOOGLE");

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        if (user.status === "BANNED") throw new Error("ACCOUNT_BANNED");
        if (user.status === "REJECTED") throw new Error("ACCOUNT_REJECTED");
        if (user.status === "PENDING_APPROVAL") throw new Error("ACCOUNT_PENDING_APPROVAL");
        if (user.status !== "ACTIVE") throw new Error(`ACCOUNT_${user.status}`);

        return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } as any;
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Upsert Google user on first sign-in
        const email = user.email!;
        const name = user.name ?? email.split("@")[0];

        let dbUser = await prisma.user.findUnique({ where: { email } });

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email,
              name,
              passwordHash: "", // Google-only account — no password
              role: "STUDENT",
              status: "ACTIVE",
              approvedAt: new Date(),
            },
          });
        }

        if (dbUser.status === "BANNED" || dbUser.status === "REJECTED") return false;

        // Attach DB id so jwt callback can pick it up
        (user as any).dbId = dbUser.id;
        (user as any).role = dbUser.role;
        (user as any).status = dbUser.status;
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        // Credentials provider sets id directly; Google sets dbId
        token.uid = (user as any).dbId ?? (user as any).id;
        token.role = (user as any).role;
        token.status = (user as any).status;
        token.provider = account?.provider ?? "credentials";
      }
      return token;
    },

    async session({ session, token }) {
      (session as any).user.id = token.uid;
      (session as any).user.role = token.role;
      (session as any).user.status = token.status;
      return session;
    },
  },
};
