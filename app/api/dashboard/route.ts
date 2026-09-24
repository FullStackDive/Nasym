import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";

function todayString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET() {
  try {
    const { session, blocked } = await requireActiveUser();
    if (!session?.user?.id) {
      return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;

    const courseWhere =
      role === "ADMIN"
        ? {}
        : role === "TEACHER"
          ? { OR: [{ ownerId: userId }, { teachers: { some: { userId } } }] }
          : {
              isPublished: true,
              enrolments: { some: { userId, status: "ACTIVE" as const } },
            };

    // Keep these sequential: pooled serverless DB connections are deliberately
    // capped at one per function instance to avoid connection exhaustion.
    const courses = await prisma.course.findMany({
      where: courseWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverUrl: true,
        _count: { select: { modules: true, enrolments: true } },
      },
    });

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        score: true,
        createdAt: true,
        quiz: {
          select: {
            id: true,
            title: true,
            _count: { select: { questions: true } },
          },
        },
      },
    });

    const lessonsCompleted = await prisma.lessonProgress.count({ where: { userId } });
    const habitRecord = await prisma.habitLog.findUnique({
      where: { userId_date: { userId, date: todayString() } },
      select: { habits: true },
    });

    const percentages = attempts
      .filter((a) => a.quiz._count.questions > 0)
      .map((a) => (a.score / a.quiz._count.questions) * 100);

    const quizSummary = {
      totalAttempts: attempts.length,
      avgScore: percentages.length
        ? percentages.reduce((sum, score) => sum + score, 0) / percentages.length
        : 0,
      recentAttempts: attempts.slice(0, 5).map((a) => ({
        id: a.id,
        score: a.score,
        total: a.quiz._count.questions,
        quizTitle: a.quiz.title,
        quizId: a.quiz.id,
        createdAt: a.createdAt,
      })),
    };

    return NextResponse.json(
      {
        courses,
        quizSummary,
        lessonsCompleted,
        habits: (habitRecord?.habits ?? {}) as Record<string, boolean>,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("[dashboard] failed:", error);
    const message = error instanceof Error ? error.message : "";
    const busy = /connection pool|timed out fetching|can't reach database|connection/i.test(message);
    return NextResponse.json(
      { error: busy ? "Database is temporarily busy. Please try again." : "Dashboard could not be loaded." },
      { status: busy ? 503 : 500 }
    );
  }
}
