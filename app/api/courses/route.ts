import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/access";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const createSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  coverUrl: z.string().url().optional().or(z.literal("")),
  isPublished: z.boolean().default(false),
});

// GET /api/courses — list courses visible to the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, id: userId } = session.user;

  let courses;

  if (role === "ADMIN") {
    courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { enrolments: true, modules: true } },
      },
    });
  } else if (role === "TEACHER") {
    courses = await prisma.course.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { teachers: { some: { userId } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { enrolments: true, modules: true } },
      },
    });
  } else {
    // STUDENT or PARENT — only published + enrolled
    courses = await prisma.course.findMany({
      where: {
        isPublished: true,
        enrolments: { some: { userId, status: "ACTIVE" } },
      },
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { modules: true } },
      },
    });
  }

  return NextResponse.json({ courses });
}

// POST /api/courses — create course (ADMIN only)
export async function POST(req: Request) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, coverUrl, isPublished } = parsed.data;

  let slug = slugify(title);
  const existing = await prisma.course.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const course = await prisma.course.create({
    data: {
      title,
      slug,
      description,
      coverUrl: coverUrl || null,
      isPublished,
      ownerId: auth.user.id,
    },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { enrolments: true, modules: true } },
    },
  });

  return NextResponse.json({ course }, { status: 201 });
}
