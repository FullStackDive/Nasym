import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 120;

export async function GET() {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: [{ isArchived: "asc" }, { isOpenForEnrolment: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverUrl: true,
      isOpenForEnrolment: true,
      isArchived: true,
      enrolmentFormUrl: true,
      startsAt: true,
      endsAt: true,
      createdAt: true,
      owner: { select: { id: true, name: true } },
      _count: { select: { enrolments: true, modules: true, lessons: true } }
    }
  });
  return NextResponse.json(
    { courses },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=600" } }
  );
}
