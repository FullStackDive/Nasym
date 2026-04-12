import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getSession() {
  return getServerSession(authOptions);
}


export async function requireActiveUser() {
          const session = await getSession();
          const userId = session?.user?.id;
          if (!userId) return { session: null as any, blocked: "UNAUTHORIZED" as const };

          const u = await prisma.user.findUnique({
            where: { id: userId },
            select: { status: true, statusReason: true, suspendedUntil: true }
          });

          if (!u) return { session: null as any, blocked: "UNAUTHORIZED" as const };

          if (u.status === "BANNED") {
            return { session: null as any, blocked: u.statusReason ? `BANNED: ${u.statusReason}` : "BANNED" };
          }

          if (u.status === "SUSPENDED") {
            const until = u.suspendedUntil;
            if (!until || until.getTime() > Date.now()) {
              const msg = until ? `SUSPENDED_UNTIL: ${until.toISOString()}` : "SUSPENDED";
              return { session: null as any, blocked: u.statusReason ? `${msg}: ${u.statusReason}` : msg };
            }
            // auto-reactivate on expired suspension
            await prisma.user.update({
              where: { id: userId },
              data: { status: "ACTIVE", suspendedUntil: null, statusReason: null }
            });
          }

          return { session, blocked: null as any };
        }
