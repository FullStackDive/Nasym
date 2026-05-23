import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/server-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProgressAgg = { all_time: bigint; last7: bigint; prev7: bigint; last14: bigint; prev14: bigint };
type QuizAgg = { all_time: bigint; last14: bigint; prev14: bigint };
type UserAgg = { active: bigint; new_week: bigint };
type ReportAgg = { open_total: bigint; awaiting: bigint };
type LiveAgg = { sessions_now: bigint; attendees_today: bigint };

let cached: { at: number; payload: unknown } | null = null;
const CACHE_MS = 30_000;

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (cached && Date.now() - cached.at < CACHE_MS) {
      return NextResponse.json(cached.payload);
    }

    const now = new Date();
    const dayMs = 86_400_000;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * dayMs);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * dayMs);
    const twentyOneDaysAgo = new Date(now.getTime() - 21 * dayMs);
    const twentyEightDaysAgo = new Date(now.getTime() - 28 * dayMs);
    const twentyFourHoursAgo = new Date(now.getTime() - dayMs);

    const progressAggRows = await prisma.$queryRaw<ProgressAgg[]>`
      SELECT
        COUNT(*)::bigint AS all_time,
        COUNT(*) FILTER (WHERE "completedAt" >= ${sevenDaysAgo})::bigint AS last7,
        COUNT(*) FILTER (WHERE "completedAt" >= ${new Date(sevenDaysAgo.getTime() - 7 * dayMs)} AND "completedAt" < ${sevenDaysAgo})::bigint AS prev7,
        COUNT(*) FILTER (WHERE "completedAt" >= ${fourteenDaysAgo})::bigint AS last14,
        COUNT(*) FILTER (WHERE "completedAt" >= ${twentyEightDaysAgo} AND "completedAt" < ${fourteenDaysAgo})::bigint AS prev14
      FROM "LessonProgress"
    `;
    const quizAggRows = await prisma.$queryRaw<QuizAgg[]>`
      SELECT
        COUNT(*)::bigint AS all_time,
        COUNT(*) FILTER (WHERE "createdAt" >= ${fourteenDaysAgo})::bigint AS last14,
        COUNT(*) FILTER (WHERE "createdAt" >= ${twentyEightDaysAgo} AND "createdAt" < ${fourteenDaysAgo})::bigint AS prev14
      FROM "QuizAttempt"
    `;
    const userAggRows = await prisma.$queryRaw<UserAgg[]>`
      SELECT
        COUNT(*) FILTER (WHERE "role" = 'STUDENT' AND "status" = 'ACTIVE')::bigint AS active,
        COUNT(*) FILTER (WHERE "role" = 'STUDENT' AND "status" = 'ACTIVE' AND "createdAt" >= ${sevenDaysAgo})::bigint AS new_week
      FROM "User"
    `;
    const reportAggRows = await prisma.$queryRaw<ReportAgg[]>`
      SELECT
        COUNT(*) FILTER (WHERE "status" = 'OPEN')::bigint AS open_total,
        COUNT(*) FILTER (WHERE "status" = 'OPEN' AND "createdAt" < ${twentyFourHoursAgo})::bigint AS awaiting
      FROM "Report"
    `;
    const liveAggRows = await prisma.$queryRaw<LiveAgg[]>`
      SELECT
        (SELECT COUNT(*) FROM "ClassSession" WHERE "isLive" = true)::bigint AS sessions_now,
        (SELECT COUNT(DISTINCT "userId") FROM "LiveMessage" WHERE "createdAt" >= ${startOfToday})::bigint AS attendees_today
    `;
    const progressLast14 = await prisma.lessonProgress.findMany({
      where: { completedAt: { gte: fourteenDaysAgo } },
      select: { completedAt: true },
    });
    const moderationQueue = await prisma.report.findMany({
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
    });
    const topLessonsAgg = await prisma.lessonProgress.groupBy({
      by: ["lessonId"],
      where: { completedAt: { gte: sevenDaysAgo } },
      _count: { lessonId: true },
      orderBy: { _count: { lessonId: "desc" } },
      take: 4,
    });
    const newStudents = await prisma.user.findMany({
      where: { createdAt: { gte: twentyFourHoursAgo } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, role: true, createdAt: true, status: true },
    });
    void twentyOneDaysAgo;

    const pAgg = progressAggRows[0] ?? ({ all_time: 0n, last7: 0n, prev7: 0n, last14: 0n, prev14: 0n } as ProgressAgg);
    const qAgg = quizAggRows[0] ?? ({ all_time: 0n, last14: 0n, prev14: 0n } as QuizAgg);
    const uAgg = userAggRows[0] ?? ({ active: 0n, new_week: 0n } as UserAgg);
    const rAgg = reportAggRows[0] ?? ({ open_total: 0n, awaiting: 0n } as ReportAgg);
    const lAgg = liveAggRows[0] ?? ({ sessions_now: 0n, attendees_today: 0n } as LiveAgg);
    const n = (b: bigint) => Number(b);

    const buckets = Array(14).fill(0) as number[];
    for (const row of progressLast14) {
      const idx = Math.floor((row.completedAt.getTime() - fourteenDaysAgo.getTime()) / dayMs);
      if (idx >= 0 && idx < 14) buckets[idx]++;
    }

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

    const pct = (curr: number, prev: number) => (prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100));

    const payload = {
      stats: {
        activeStudents: n(uAgg.active),
        studentsNewThisWeek: n(uAgg.new_week),
        liveAttendeesToday: n(lAgg.attendees_today),
        liveSessionsNow: n(lAgg.sessions_now),
        lessonCompletions: n(pAgg.all_time),
        lessonCompletionsLast7: n(pAgg.last7),
        lessonCompletionsDelta: pct(n(pAgg.last7), n(pAgg.prev7)),
        openReports: n(rAgg.open_total),
        awaitingReview: n(rAgg.awaiting),
      },
      engagement: {
        buckets,
        lessonViews: n(pAgg.all_time),
        lessonViewsDelta: pct(n(pAgg.last14), n(pAgg.prev14)),
        quizAttempts: n(qAgg.all_time),
        quizAttemptsDelta: pct(n(qAgg.last14), n(qAgg.prev14)),
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
    };

    cached = { at: Date.now(), payload };
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[admin/overview] failed:", e);
    if (
      e instanceof Prisma.PrismaClientKnownRequestError ||
      e instanceof Prisma.PrismaClientInitializationError ||
      e instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      return NextResponse.json({ error: "Database is busy. Try again in a moment." }, { status: 503 });
    }
    const msg = e instanceof Error ? e.message : "Unknown error";
    const isPoolTimeout = /connection pool|Timed out fetching/i.test(msg);
    return NextResponse.json(
      { error: isPoolTimeout ? "Database is busy. Try again in a moment." : `Overview failed: ${msg}` },
      { status: isPoolTimeout ? 503 : 500 }
    );
  }
}
