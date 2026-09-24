"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icon, AppBar, Stat } from "./ui";
import { Breeze, KhatamPattern, LeafSprig } from "./motifs";

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl: string | null;
  _count: { modules?: number; enrolments?: number };
};

type QuizSummary = {
  totalAttempts: number;
  avgScore: number;
  recentAttempts: { id: string; score: number; total: number; quizTitle: string; quizId: string; createdAt: string }[];
};

const DEFAULT_HABITS = [
  { id: "fajr", label: "Fajr prayer", time: "before sunrise" },
  { id: "quran", label: "Read 1 page of Qur'an", time: "anytime" },
  { id: "dhuhr", label: "Ẓuhr prayer", time: "midday" },
  { id: "asr", label: "ʿAṣr prayer", time: "afternoon" },
  { id: "maghrib", label: "Maghrib prayer", time: "sunset" },
  { id: "isha", label: "ʿIshāʾ prayer", time: "night" },
];

const hueBg = (i: number) => i % 3 === 0 ? "linear-gradient(135deg, var(--brand-700), var(--brand-900))"
  : i % 3 === 1 ? "linear-gradient(135deg, var(--c-mid), var(--brand-700))"
  : "linear-gradient(135deg, var(--accent-500), var(--accent-600))";

const DashboardClient = () => {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [tab, setTab] = useState("dashboard");
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizSummary, setQuizSummary] = useState<QuizSummary | null>(null);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [habits, setHabits] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Dashboard could not be loaded.");
      setCourses(data?.courses ?? []);
      setQuizSummary(data?.quizSummary ?? { totalAttempts: 0, avgScore: 0, recentAttempts: [] });
      setLessonsCompleted(data?.lessonsCompleted ?? 0);
      setHabits(data?.habits ?? {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard");
      return;
    }
    if (authStatus === "authenticated") load();
  }, [authStatus, load, router]);

  async function toggleHabit(id: string) {
    const next = { ...habits, [id]: !habits[id] };
    setHabits(next);
    await fetch("/api/reminders/today", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habits: next }),
    }).catch(() => {});
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="app">
        <AppBar active={tab} onNav={setTab} />
        <div className="app-scroll">
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "80px 32px", color: "var(--ink-3)" }}>Loading your dashboard…</div>
        </div>
      </div>
    );
  }

  const userName = session?.user?.name ?? "friend";
  const firstName = userName.split(" ")[0];
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = userRole === "ADMIN";
  const habitsDone = DEFAULT_HABITS.filter(h => habits[h.id]).length;

  const adminQuickLinks: [string, string, "users" | "video" | "book" | "newspaper" | "check" | "trend" | "shield"][] = [
    ["/admin", "Admin overview", "shield"],
    ["/admin/users", "Users", "users"],
    ["/admin/classes", "Classes", "video"],
    ["/admin/lessons", "Lessons", "book"],
    ["/admin/quizzes", "Quizzes", "check"],
    ["/admin/news", "News", "newspaper"],
    ["/admin/reports", "Reports", "newspaper"],
    ["/admin/analytics", "Analytics", "trend"],
  ];

  return (
    <div className="app">
      <AppBar active={tab} onNav={setTab} />
      <div className="app-scroll">
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 32px 64px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
            <div>
              <div className="eyebrow">Assalāmu ʿalaykum</div>
              <h1 className="serif" style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.02em", margin: "10px 0 0" }}>Welcome back, <em style={{ color:"var(--brand-700)" }}>{firstName}</em></h1>
              <p style={{ color: "var(--ink-3)", marginTop: 8, fontSize: 15 }}>
                {courses.length === 0 ? "You're not enrolled in a course yet — browse open courses to get started." : `You're enrolled in ${courses.length} course${courses.length === 1 ? "" : "s"}.`}
              </p>
            </div>
            <div style={{ display:"flex", gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => router.push("/classes")}><Icon name="calendar" size={14}/> Schedule</button>
              <button className="btn btn-primary" onClick={() => router.push("/courses")}><Icon name="book" size={14}/> My courses</button>
            </div>
          </div>

          {isAdmin && (
            <div style={{
              position: "relative",
              overflow: "hidden",
              padding: 22,
              marginBottom: 24,
              borderRadius: 18,
              background: "linear-gradient(135deg, var(--brand-800), var(--brand-900))",
              color: "white",
              border: "1px solid var(--brand-700)",
            }}>
              <KhatamPattern opacity={0.06} color="white" />
              <div style={{ position: "relative", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="shield" size={22} />
                  </span>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.75, fontWeight: 700 }}>Admin</div>
                    <div className="serif" style={{ fontSize: 22, fontWeight: 500, marginTop: 2 }}>Manage the platform</div>
                    <div style={{ fontSize: 13, opacity: 0.78, marginTop: 4 }}>Users, content, classes, quizzes, reports & analytics.</div>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/admin")}
                  className="btn"
                  style={{ background: "white", color: "var(--brand-800)", fontWeight: 700 }}
                >
                  Open admin panel <Icon name="arrow-right" size={14} />
                </button>
              </div>
              <div style={{ position: "relative", display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                {adminQuickLinks.slice(1).map(([href, label, icon]) => (
                  <button
                    key={href}
                    onClick={() => router.push(href)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 12px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.12)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.18)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Icon name={icon} size={13} /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            <Stat label="Lessons watched" value={lessonsCompleted} icon="book" />
            <Stat label="Quizzes taken" value={quizSummary?.totalAttempts ?? 0} icon="check" />
            <Stat label="Avg quiz score" value={quizSummary && quizSummary.totalAttempts > 0 ? `${Math.round(quizSummary.avgScore)}%` : "—"} icon="trophy" />
            <Stat label="Reminders today" value={`${habitsDone} / ${DEFAULT_HABITS.length}`} icon="flame" />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1.4fr .9fr", gap: 22 }}>
            <div>
              <div className="surface" style={{ padding: 26 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom: 18 }}>
                  <h2 className="serif" style={{ margin: 0, fontSize: 26, fontWeight: 500, letterSpacing:"-0.01em" }}>Continue learning</h2>
                  <a onClick={() => router.push("/courses")} style={{ color:"var(--brand-700)", fontSize: 13, fontWeight: 600, cursor:"pointer" }}>All courses →</a>
                </div>
                {courses.length === 0 ? (
                  <div style={{ padding: "28px 0", textAlign: "center", color: "var(--ink-3)" }}>
                    <p style={{ margin: "0 0 14px", fontSize: 14 }}>You're not enrolled in any course yet.</p>
                    <button className="btn btn-primary btn-sm" onClick={() => router.push("/courses")}>Browse open courses</button>
                  </div>
                ) : (
                  courses.map((c, i) => (
                    <div key={c.id} style={{ display:"flex", gap: 18, alignItems:"center", padding: "16px 0", borderTop: i ? "1px solid var(--hairline)" : "none" }}>
                      <div style={{ width: 96, height: 72, borderRadius: 12, background: hueBg(i), position:"relative", overflow:"hidden", flexShrink: 0 }}>
                        <Breeze opacity={0.3} color="white" />
                        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"white", opacity: 0.85 }}><LeafSprig size={22} color="white"/></div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="serif" style={{ margin: 0, fontSize: 19, fontWeight: 500, letterSpacing:"-0.01em" }}>{c.title}</h3>
                        <p style={{ margin: "4px 0 0", color:"var(--ink-3)", fontSize: 13, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.description}</p>
                      </div>
                      <button onClick={() => router.push(`/courses/${c.id}`)} className="btn btn-secondary btn-sm">Open</button>
                    </div>
                  ))
                )}
              </div>

              {quizSummary && quizSummary.recentAttempts.length > 0 && (
                <div className="surface" style={{ padding: 26, marginTop: 22 }}>
                  <h2 className="serif" style={{ margin: "0 0 16px", fontSize: 22, fontWeight: 500, letterSpacing:"-0.01em" }}>Recent quiz attempts</h2>
                  {quizSummary.recentAttempts.map((a, i) => {
                    const pct = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
                    return (
                      <div key={a.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 0", borderTop: i ? "1px solid var(--hairline)" : "none" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{a.quizTitle}</div>
                          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{new Date(a.createdAt).toLocaleDateString()}</div>
                        </div>
                        <span className={"chip " + (pct >= 70 ? "chip-mint" : "chip")}>{a.score}/{a.total} · {pct}%</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/quizzes/${a.quizId}`)}>Retake</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className="surface" style={{ padding: 24 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                  <h2 className="serif" style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing:"-0.01em" }}>Today&apos;s reminders</h2>
                  <span className="chip chip-brand">{habitsDone} / {DEFAULT_HABITS.length}</span>
                </div>
                <p style={{ margin: "8px 0 14px", fontSize: 12, color: "var(--ink-3)" }}>Tick what you've done today. Resets each morning.</p>
                <div style={{ display:"flex", flexDirection:"column", gap: 8 }}>
                  {DEFAULT_HABITS.map(h => {
                    const done = !!habits[h.id];
                    return (
                      <button key={h.id} onClick={() => toggleHabit(h.id)}
                        style={{ display:"flex", alignItems:"center", gap: 12, padding: "11px 14px", background: done ? "var(--mint-bg)" : "var(--bg-soft)", border: "1px solid " + (done ? "var(--mint-300)" : "var(--hairline)"), borderRadius: 12, textAlign:"left", cursor:"pointer", fontFamily:"inherit", color:"inherit" }}>
                        <span style={{ width: 22, height: 22, borderRadius: 999, border: "2px solid " + (done ? "var(--brand-700)" : "var(--ink-3)"), display:"inline-flex", alignItems:"center", justifyContent:"center", background: done ? "var(--brand-700)" : "transparent", color:"white", flexShrink:0 }}>
                          {done && <Icon name="check" size={12} stroke={3}/>}
                        </span>
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, textDecoration: done ? "line-through" : "none", color: done ? "var(--ink-3)" : "var(--ink)" }}>{h.label}</span>
                        <span style={{ fontSize: 11, color:"var(--ink-3)" }}>{h.time}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="surface" style={{ padding: 24, marginTop: 14, position:"relative", overflow:"hidden", background: "linear-gradient(160deg, var(--mint-bg), var(--surface))" }}>
                <KhatamPattern opacity={0.05} />
                <div style={{ position: "absolute", top: 16, right: 16 }}><LeafSprig size={28}/></div>
                <div style={{ position: "relative" }}>
                  <div className="eyebrow">Reflection</div>
                  <p className="serif" style={{ margin: "12px 0 0", fontSize: 17, color: "var(--ink-2)", lineHeight: 1.5 }}>
                    Patience is paired with prayer in the Qur'an — both are active forms of seeking help. When something tests you today, slow down for two seconds and breathe. That pause <i>is</i> ṣabr.
                  </p>
                  <button className="btn btn-ghost btn-sm" onClick={() => router.push("/blog")} style={{ marginTop: 14, padding: 0, color:"var(--brand-700)" }}>More reflections <Icon name="arrow-right" size={12}/></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardClient;
