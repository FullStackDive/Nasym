import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/parent/children — list this parent's linked children
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, id: parentId } = session.user;
  if (role !== "PARENT" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const children = await prisma.user.findMany({
    where: { parentId },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
      enrolments: {
        select: {
          id: true,
          enrolledAt: true,
          course: { select: { id: true, title: true, slug: true } },
        },
      },
    },
  });

  return NextResponse.json({ children });
}
