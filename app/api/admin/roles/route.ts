import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/server-session";
import type { Role } from "@prisma/client";

// GET /api/admin/roles — counts per role + permission catalogue.
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [grouped, permissions] = await Promise.all([
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
      where: { status: "ACTIVE" },
    }),
    prisma.permission.findMany({ orderBy: { key: "asc" } }),
  ]);

  const counts: Record<Role, number> = {
    ADMIN: 0,
    TEACHER: 0,
    STUDENT: 0,
    PARENT: 0,
  };
  for (const row of grouped) counts[row.role] = row._count._all;

  return NextResponse.json({ counts, permissions });
}
