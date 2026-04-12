"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Badge, Button, Card } from "@/components/ui";

type PermissionKey = "manage_users" | "manage_news" | "manage_posters" | "manage_classes" | "manage_lessons" | "manage_quizzes" | "manage_reports";

type RecentAttempt = { id: string; score: number; total: number; quizTitle: string; quizId: string; createdAt: string };

const HABIT_TOTAL = 4;

export default function DashboardClient() {
  const { data } = useSession();
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [role, setRole] = useState<"ADMIN" | "STUDENT">("STUDENT");
  const [lessonsWatched, setLessonsWatched] = useState<number | null>(null);
  const [totalAttempts, setTotalAttempts] = useState<number | null>(null);
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
  const [habitsDone, setHabitsDone] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/me/permissions").then((r) => r.json()).catch(() => ({})),
      fetch("/api/me/progress").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/me/quiz-summary").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/reminders/today").then((r) => r.ok ? r.json() : null).catch(() => null)
    ]).then(([permsData, progressData, quizData, habitsData]) => {
      setRole(permsData.role ?? "STUDENT");
      setPermissions(permsData.permissions ?? []);

      if (progressData) setLessonsWatched(progressData.progress?.length ?? 0);
      if (quizData) {
        setTotalAttempts(quizData.totalAttempts ?? 0);
        setAvgScore(quizData.avgScore ?? 0);
        setRecentAttempts(quizData.recentAttempts ?? []);
      }
      if (habitsData?.habits) {
        const done = Object.values(habitsData.habits as Record<string, boolean>).filter(Boolean).length;
        setHabitsDone(done);
      }
    });
  }, []);

  const canAdmin = role === "ADMIN" || permissions.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Dashboard</h1>
          <p className="mt-2 text-slate-600">Assalamu alaikum, {data?.user?.name}.</p>
        </div>
        <Badge>{role}</Badge>
      </div>

      {/* Stats row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lessons watched</p>
          <p className="mt-2 text-3xl font-black">{lessonsWatched ?? "—"}</p>
          <Link href="/lessons" className="mt-3 inline-block text-sm font-semibold text-brand-700">Browse lessons →</Link>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quizzes taken</p>
          <p className="mt-2 text-3xl font-black">{totalAttempts ?? "—"}</p>
          <Link href="/quizzes" className="mt-3 inline-block text-sm font-semibold text-brand-700">Browse quizzes →</Link>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg quiz score</p>
          <p className="mt-2 text-3xl font-black">
            {avgScore !== null && totalAttempts ? `${avgScore.toFixed(1)}` : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">points per attempt</p>
        </Card>
      </div>

      {/* Recent quiz attempts */}
      {recentAttempts.length > 0 && (
        <Card className="mt-4 p-6">
          <h2 className="font-extrabold">Recent quiz attempts</h2>
          <div className="mt-4 space-y-2">
            {recentAttempts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-3">
                <div>
                  <Link href={`/quizzes/${a.quizId}`} className="text-sm font-semibold hover:underline">{a.quizTitle}</Link>
                  <p className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
                <Badge>{a.score}/{a.total}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick links */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="font-extrabold">Join classes</h3>
          <p className="mt-2 text-sm text-slate-600">View scheduled sessions and join live rooms.</p>
          <Link href="/classes" className="mt-4 inline-block">
            <Button>Open classes</Button>
          </Link>
        </Card>

        <Card className="p-6">
          <h3 className="font-extrabold">Daily reminders</h3>
          <p className="mt-2 text-sm text-slate-600">
            {habitsDone !== null ? `${habitsDone}/${HABIT_TOTAL} habits done today.` : "Build small habits daily."}
          </p>
          <Link href="/reminders" className="mt-4 inline-block">
            <Button variant="secondary">Open reminders</Button>
          </Link>
        </Card>

        <Card className="p-6">
          <h3 className="font-extrabold">News board</h3>
          <p className="mt-2 text-sm text-slate-600">Read updates from admins/teachers.</p>
          <Link href="/news" className="mt-4 inline-block">
            <Button variant="secondary">Open news</Button>
          </Link>
        </Card>
      </div>

      {/* Permissions */}
      <Card className="mt-4 p-6">
        <h2 className="text-xl font-black">Your permissions</h2>
        <p className="mt-2 text-sm text-slate-600">
          Admins have all permissions by default. Students can be given specific permissions.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {role === "ADMIN" ? (
            <Badge>All permissions</Badge>
          ) : permissions.length === 0 ? (
            <Badge>No special permissions</Badge>
          ) : (
            permissions.map((p) => <Badge key={p}>{p}</Badge>)
          )}
        </div>

        {canAdmin && (
          <div className="mt-6">
            <Link href="/admin"><Button>Open Admin Panel</Button></Link>
          </div>
        )}
      </Card>
    </div>
  );
}
