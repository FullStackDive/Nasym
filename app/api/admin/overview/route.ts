import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/server-session";

// GET /api/admin/overview — aggregated stats for the admin dashboard.
// All numbers are real (computed from the DB at request time).
export async function GET() {
  try {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayStart = (offset: number) =>
    new Date(startOfToday.getTime() - offset * dayMs);
  const sevenDaysAgo = new Date(now.getTime() - 7 * dayMs);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * dayMs);
  const twentyFourHoursAgo = new Date(now.getTime() - dayMs);

  const [
    activeStudents,
    studentsNewThisWeek,
    liveSessionsNow,
    liveAttendeesToday,
    lessonCompletionsAllTime,
    lessonCompletionsLast7,
    lessonCompletionsPrev7,
    openReports,
    awaitingReview,
    lessonViewsTotal,
    lessonViewsLast14,
    lessonViewsPrev14,
    quizAttemptsTotal,
    quizAttemptsLast14,
    quizAttemptsPrev14,
    progressLast14,
    moderationQueue,
    topLessonsAgg,
    newStudents,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "STUDENT", status: "ACTIVE", createdAt: { gte: sevenDaysAgo } } }),
    prisma.classSession.count({ where: { isLive: true } }),
    // Unique users who posted at least one live message today (proxy for "live attendees today").
    prisma.liveMessage
      .findMany({
        where: { createdAt: { gte: startOfToday } },
        select: { userId: true },
        distinct: ["userId"],
      })
      .then(rows => rows.length),
    prisma.lessonProgress.count(),
    prisma.lessonProgress.count({ where: { completedAt: { gte: sevenDaysAgo } } }),
    prisma.lessonProgress.count({
      where: { completedAt: { gte: new Date(sevenDaysAgo.getTime() - 7 * dayMs), lt: sevenDaysAgo } },
    }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.report.count({ where: { status: "OPEN", createdAt: { lt: twentyFourHoursAgo } } }),
    prisma.lessonProgress.count(),
    prisma.lessonProgress.count({ where: { completedAt: { gte: fourteenDaysAgo } } }),
    prisma.lessonProgress.count({
      where: {
        completedAt: { gte: new Date(fourteenDaysAgo.getTime() - 14 * dayMs), lt: fourteenDaysAgo },
      },
    }),
    prisma.quizAttempt.count(),
    prisma.quizAttempt.count({ where: { createdAt: { gte: fourteenDaysAgo } } }),
    prisma.quizAttempt.count({
      where: {
        createdAt: { gte: new Date(fourteenDaysAgo.getTime() - 14 * dayMs), lt: fourteenDaysAgo },
      },
    }),
    prisma.lessonProgress.findMany({
      where: { completedAt: { gte: fourteenDaysAgo } },
      select: { completedAt: true },
    }),
    prisma.report.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        targetType: true,
        reason: true,
        createdAt: true,
        lesson: { select: { id: true, title: true } },
        quiz: { select: { id: true, title: true } },
        reporter: { select: { name: true } },
      },
    }),
    // Top 4 lessons by completions in the last 7 days.
    prisma.lessonProgress.groupBy({
      by: ["lessonId"],
      where: { completedAt: { gte: sevenDaysAgo } },
      _count: { lessonId: true },
      orderBy: { _count: { lessonId: "desc" } },
      take: 4,
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: twentyFourHoursAgo } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, role: true, createdAt: true, status: true },
    }),
  ]);

  // Bucket lesson completions into 14 daily counts for the chart.
  const buckets = Array(14).fill(0) as number[];
  for (const row of progressLast14) {
    const idx = Math.floor((row.completedAt.getTime() - fourteenDaysAgo.getTime()) / dayMs);
    if (idx >= 0 && idx < 14) buckets[idx]++;
  }

  // Resolve lesson titles for top-lessons.
  const topLessonIds = topLessonsAgg.map(r => r.lessonId);
  const lessonRows = topLessonIds.length
    ? await prisma.lesson.findMany({
        where: { id: { in: topLessonIds } },
        select: { id: true, title: true, tags: true },
      })
    : [];
  const lessonById = new Map(lessonRows.map(l => [l.id, l]));
  const topLessons = topLessonsAgg.map(r => ({
    id: r.lessonId,
    title: lessonById.get(r.lessonId)?.title ?? "(deleted lesson)",
    tags: lessonById.get(r.lessonId)?.tags ?? null,
    completions: r._count.lessonId,
  }));

  const pct = (curr: number, prev: number) =>
    prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

  return NextResponse.json({
    stats: {
      activeStudents,
      studentsNewThisWeek,
      liveAttendeesToday,
      liveSessionsNow,
      lessonCompletions: lessonCompletionsAllTime,
      lessonCompletionsLast7,
      lessonCompletionsDelta: pct(lessonCompletionsLast7, lessonCompletionsPrev7),
      openReports,
      awaitingReview,
    },
    engagement: {
      buckets, // 14 ints, oldest → newest
      lessonViews: lessonViewsTotal,
      lessonViewsDelta: pct(lessonViewsLast14, lessonViewsPrev14),
      quizAttempts: quizAttemptsTotal,
      quizAttemptsDelta: pct(quizAttemptsLast14, quizAttemptsPrev14),
    },
    moderationQueue: moderationQueue.map(r => ({
      id: r.id,
      targetType: r.targetType,
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
      lesson: r.lesson,
      quiz: r.quiz,
      reporterName: r.reporter.name,
    })),
    topLessons,
    newStudents: newStudents.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
    })),
    generatedAt: now.toISOString(),
  });
  } catch (e) {
    console.error("[admin/overview] failed:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: `Overview failed: ${msg}` }, { status: 500 });
  }
}
