"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icon, Avatar, AppBar, Stat } from "./ui";

type IconName = "home" | "book" | "video" | "users" | "user" | "newspaper" | "bell" | "settings" | "search" | "play" | "pause" | "mic" | "mic-off" | "cam" | "cam-off" | "hand" | "send" | "rec" | "chat" | "poll" | "notes" | "trophy" | "flame" | "star" | "leaf" | "calendar" | "clock" | "check" | "plus" | "filter" | "more" | "shield" | "globe" | "lock" | "mail" | "moon" | "arrow-right" | "trend" | "download" | "upload" | "edit" | "trash" | "eye" | "key" | "wind";

type NavGroup = { group: string; items: [string, string, IconName][] };

const adminNav: NavGroup[] = [
  { group: "Overview", items: [["overview","Dashboard","home"],["analytics","Analytics","trend"]] },
  { group: "People", items: [["users","Users","users"],["approvals","Pending approvals","clock"],["invitations","Invitations","mail"],["perms","Roles & permissions","shield"],["reports","Reports & moderation","newspaper"]] },
  { group: "Content", items: [["courses","Courses","book"],["classes","Classes","video"],["lessons","Lessons","book"],["news","News","newspaper"],["posters","Posters","newspaper"],["quizzes","Quizzes","check"],["ask","Ask Us — Q&A","mail"]] },
];

const Sparkline = ({ data, color = "var(--brand-600)" }: { data: number[]; color?: string }) => {
  if (!data.length) return <div style={{ height: 60, color: "var(--ink-3)", fontSize: 12, display: "flex", alignItems: "center" }}>No data yet.</div>;
  const max = Math.max(...data, 1);
  const w = 200, h = 60;
  const pts = data.map((d, i) => `${(i/Math.max(data.length-1,1))*w},${h - (d/max)*h*0.9 - 4}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width:"100%", height: 60 }}>
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts}/>
      <polyline fill={color} fillOpacity="0.10" stroke="none" points={`0,${h} ${pts} ${w},${h}`}/>
    </svg>
  );
};

const ROUTE_KEYS: Record<string, string> = {
  users: "/admin/users",
  classes: "/admin/classes",
  lessons: "/admin/lessons",
  quizzes: "/admin/quizzes",
  news: "/admin/news",
  posters: "/admin/posters",
  reports: "/admin/reports",
  analytics: "/admin/analytics",
};

export const AdminShell = ({ active, onNav, children }: { active: string; onNav?: (k: string) => void; children: ReactNode }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const role = ((session?.user as { role?: string } | undefined)?.role ?? "ADMIN");
  const name = session?.user?.name ?? "Admin";
  const email = session?.user?.email ?? "";

  const handle = (k: string) => {
    if (onNav) { onNav(k); return; }
    const route = ROUTE_KEYS[k];
    if (route) router.push(route);
    else if (k === "overview") router.push("/admin");
    else router.push(`/admin?v=${encodeURIComponent(k)}`);
  };

  const appbarActiveMap: Record<string, string> = {
    overview: "overview",
    users: "users", approvals: "users", invitations: "users", perms: "users",
    reports: "reports",
    analytics: "analytics",
    courses: "content", classes: "content", lessons: "content",
    news: "content", posters: "content", quizzes: "content", ask: "content",
  };
  const appbarActive = appbarActiveMap[active] ?? "";

  return (
  <div className="app">
    <AppBar active={appbarActive} role="ADMIN" showSearch={true} />
    <div style={{ display:"flex", minHeight: "calc(100vh - 72px)" }}>
      <div className="sidebar">
        {adminNav.map(g => (
          <div key={g.group}>
            <div className="group-label">{g.group}</div>
            {g.items.map(([k, label, icon]) => (
              <a key={k} className={active === k ? "active" : ""} onClick={() => handle(k)}>
                <Icon name={icon} size={16}/> {label}
              </a>
            ))}
          </div>
        ))}
        <div style={{ flex: 1 }}/>
        <div style={{ padding: 12, background:"var(--bg-soft)", borderRadius: 12, border:"1px solid var(--hairline)", marginTop: 12 }}>
          <span className="chip chip-brand" style={{ marginBottom: 8 }}><Icon name="shield" size={11}/> {role === "ADMIN" ? "Super admin" : role}</span>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>{name}</div>
          <div style={{ fontSize: 11, color:"var(--ink-3)" }}>{email}</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
    </div>
  </div>
  );
};

type OverviewData = {
  stats: {
    activeStudents: number;
    studentsNewThisWeek: number;
    liveAttendeesToday: number;
    liveSessionsNow: number;
    lessonCompletions: number;
    lessonCompletionsLast7: number;
    lessonCompletionsDelta: number;
    openReports: number;
    awaitingReview: number;
  };
  engagement: {
    buckets: number[];
    lessonViews: number;
    lessonViewsDelta: number;
    quizAttempts: number;
    quizAttemptsDelta: number;
  };
  moderationQueue: {
    id: string;
    targetType: "LESSON" | "QUIZ" | "USER";
    reason: string;
    createdAt: string;
    lesson: { id: string; title: string } | null;
    quiz: { id: string; title: string } | null;
    reporterName: string;
  }[];
  topLessons: {
    id: string;
    title: string;
    tags: string | null;
    completions: number;
  }[];
  newStudents: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
  }[];
  generatedAt: string;
};

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function deltaText(pct: number, neutral = "flat") {
  if (pct === 0) return { text: neutral, color: "var(--ink-3)" };
  const sign = pct > 0 ? "+" : "";
  return {
    text: `${sign}${pct}%`,
    color: pct > 0 ? "oklch(0.6 0.16 140)" : "var(--danger, #e53e3e)",
  };
}

const VALID_VIEWS = new Set(["overview", "approvals", "invitations", "courses", "perms", "ask"]);

const AdminClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = (() => {
    const v = searchParams?.get("v") ?? "overview";
    return VALID_VIEWS.has(v) ? v : "overview";
  })();
  const [view, setView] = useState(initialView);

  useEffect(() => {
    const v = searchParams?.get("v") ?? "overview";
    setView(VALID_VIEWS.has(v) ? v : "overview");
  }, [searchParams]);

  const { data: session } = useSession();
  const adminName = (session?.user?.name ?? "Admin").split(" ")[0];

  const handleNav = (k: string) => {
    const route = ROUTE_KEYS[k];
    if (route) { router.push(route); return; }
    if (k === "overview") {
      router.replace("/admin");
      setView("overview");
      return;
    }
    router.replace(`/admin?v=${encodeURIComponent(k)}`);
    setView(k);
  };

  if (view === "approvals")   return <AdminShell active="approvals"   onNav={handleNav}><AdminApprovals /></AdminShell>;
  if (view === "invitations") return <AdminShell active="invitations" onNav={handleNav}><AdminInvitations /></AdminShell>;
  if (view === "courses")     return <AdminShell active="courses"     onNav={handleNav}><AdminCourses /></AdminShell>;
  if (view === "perms")       return <AdminShell active="perms"       onNav={handleNav}><AdminPerms /></AdminShell>;
  if (view === "ask")         return <AdminShell active="ask"         onNav={handleNav}><AdminAskUs /></AdminShell>;

  return (
    <AdminShell active="overview" onNav={handleNav}>
      <AdminOverview adminName={adminName} onNav={handleNav} />
    </AdminShell>
  );
};

const AdminOverview = ({ adminName, onNav }: { adminName: string; onNav: (k: string) => void }) => {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    (async () => {
      try {
        const res = await fetch("/api/admin/overview", { cache: "no-store" });
        const text = await res.text();
        let d: { error?: string } & Record<string, unknown> = {};
        try { d = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }
        if (cancelled) return;
        if (!res.ok) {
          setError(d?.error ?? `Overview request failed (HTTP ${res.status}).`);
          return;
        }
        setData(d as unknown as OverviewData);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "network error";
          setError(`Could not reach the server (${msg}). Is the dev server running?`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const greeting = useGreeting();

  if (loading) {
    return (
      <div style={{ padding: "32px 36px", color: "var(--ink-3)" }}>Loading overview…</div>
    );
  }
  if (error || !data) {
    return (
      <div style={{ padding: "32px 36px" }}>
        <div className="surface" style={{ padding: 24, color: "var(--danger, #e53e3e)", display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
          <div>{error ?? "Could not load overview"}</div>
          <button className="btn btn-secondary" onClick={() => setReloadKey(k => k + 1)}>Retry</button>
        </div>
      </div>
    );
  }

  const lessonDelta = deltaText(data.stats.lessonCompletionsDelta);
  const viewDelta = deltaText(data.engagement.lessonViewsDelta);
  const quizDelta = deltaText(data.engagement.quizAttemptsDelta);

  return (
    <div style={{ padding: "32px 36px 56px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom: 24, flexWrap:"wrap", gap: 12 }}>
        <div>
          <div className="eyebrow">Admin overview</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing:"-0.025em", margin: "6px 0 0" }}>
            {greeting}, {adminName}
          </h1>
          <p style={{ color:"var(--ink-3)", marginTop: 6 }}>
            Here&apos;s what&apos;s happening across Nasym Ur Rahmah today.
          </p>
        </div>
        <div style={{ display:"flex", gap: 8, flexWrap:"wrap" }}>
          <button className="btn btn-secondary" onClick={() => router.push("/admin/analytics")}>
            <Icon name="trend" size={14}/> View analytics
          </button>
          <button className="btn btn-primary" onClick={() => router.push("/admin/news")}>
            <Icon name="plus" size={14}/> New news post
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, minmax(0, 1fr))", gap: 14 }}>
        <Stat
          label="Active students"
          value={data.stats.activeStudents.toLocaleString()}
          sub={data.stats.studentsNewThisWeek > 0 ? `↑ ${data.stats.studentsNewThisWeek} this week` : "No new this week"}
          icon="users"
        />
        <Stat
          label="Live attendees today"
          value={data.stats.liveAttendeesToday.toLocaleString()}
          sub={data.stats.liveSessionsNow > 0
            ? `${data.stats.liveSessionsNow} class${data.stats.liveSessionsNow === 1 ? "" : "es"} live now`
            : "No live classes right now"}
          icon="video"
        />
        <Stat
          label="Lesson completions"
          value={data.stats.lessonCompletions.toLocaleString()}
          sub={data.stats.lessonCompletionsLast7 > 0
            ? `${lessonDelta.text} vs last week`
            : "No completions last 7 days"}
          icon="book"
        />
        <Stat
          label="Open reports"
          value={data.stats.openReports.toLocaleString()}
          sub={data.stats.awaitingReview > 0
            ? `${data.stats.awaitingReview} > 24 h old`
            : "Queue clear"}
          icon="shield"
        />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.4fr .9fr", gap: 18, marginTop: 18 }}>
        <div className="surface" style={{ padding: 24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Lesson completions · last 14 days</h3>
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
              {data.engagement.buckets.reduce((a, b) => a + b, 0).toLocaleString()} total
            </span>
          </div>
          <Sparkline data={data.engagement.buckets} />
          <div style={{ display:"grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18, marginTop: 18 }}>
            <div>
              <div className="eyebrow">Lesson views (all-time)</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{data.engagement.lessonViews.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: viewDelta.color }}>{viewDelta.text} vs prev 14d</div>
            </div>
            <div>
              <div className="eyebrow">Quiz attempts (all-time)</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{data.engagement.quizAttempts.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: quizDelta.color }}>{quizDelta.text} vs prev 14d</div>
            </div>
          </div>
        </div>

        <div className="surface" style={{ padding: 24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Open reports</h3>
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{data.stats.openReports} total</span>
          </div>
          {data.moderationQueue.length === 0 ? (
            <div style={{ color:"var(--ink-3)", fontSize: 13, padding:"12px 0" }}>No open reports — queue is clear.</div>
          ) : data.moderationQueue.map((r, i) => {
            const subject = r.lesson?.title ?? r.quiz?.title ?? `User report`;
            return (
              <div key={r.id} style={{ display:"flex", gap: 12, alignItems:"center", padding: "12px 0", borderTop: i ? "1px solid var(--hairline)" : "none" }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--danger, #e53e3e)" }}/>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13.5 }}>
                  <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.targetType}: {subject}
                  </div>
                  <div style={{ fontSize: 11, color:"var(--ink-3)" }}>
                    {r.reason} · {timeAgo(r.createdAt)} · by {r.reporterName}
                  </div>
                </div>
              </div>
            );
          })}
          <button className="btn btn-secondary btn-sm" style={{ width:"100%", marginTop: 8 }} onClick={() => router.push("/admin/reports")}>
            View all reports
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap: 18, marginTop: 18 }}>
        <div className="surface" style={{ padding: 24 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>Top lessons · last 7 days</h3>
          {data.topLessons.length === 0 ? (
            <div style={{ color: "var(--ink-3)", fontSize: 13 }}>No lessons have been completed in the last 7 days yet.</div>
          ) : (
            <table style={{ width:"100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color:"var(--ink-3)", textAlign:"left", fontSize: 11, textTransform:"uppercase", letterSpacing:".08em" }}>
                  <th style={{ padding: "8px 0" }}>Lesson</th>
                  <th style={{ textAlign: "right" }}>Completions</th>
                </tr>
              </thead>
              <tbody>
                {data.topLessons.map(l => (
                  <tr key={l.id} style={{ borderTop:"1px solid var(--hairline)" }}>
                    <td style={{ padding:"12px 0" }}>
                      <div style={{ fontWeight: 600 }}>
                        <a onClick={() => router.push(`/lessons/${l.id}`)} style={{ cursor: "pointer", color: "var(--ink)" }}>
                          {l.title}
                        </a>
                      </div>
                      {l.tags && <div style={{ fontSize: 11, color:"var(--ink-3)" }}>{l.tags}</div>}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{l.completions.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="surface" style={{ padding: 24 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>New students · last 24 h</h3>
          {data.newStudents.length === 0 ? (
            <div style={{ color: "var(--ink-3)", fontSize: 13 }}>No new registrations in the last 24 hours.</div>
          ) : data.newStudents.map((u, i) => (
            <div key={u.id} style={{ display:"flex", gap: 12, alignItems:"center", padding: "10px 0", borderTop: i ? "1px solid var(--hairline)" : "none" }}>
              <Avatar name={u.name} size={32}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                <div style={{ fontSize: 11, color:"var(--ink-3)" }}>{u.email} · {u.status}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push("/admin/users")}>View</button>
            </div>
          ))}
          <button className="btn btn-secondary btn-sm" style={{ width:"100%", marginTop: 8 }} onClick={() => onNav("users")}>
            Manage all users
          </button>
        </div>
      </div>
    </div>
  );
};

function useGreeting() {
  const [text, setText] = useState("Welcome back");
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 5) setText("Working late");
    else if (h < 12) setText("Good morning");
    else if (h < 17) setText("Good afternoon");
    else if (h < 22) setText("Good evening");
    else setText("Working late");
  }, []);
  return text;
}

/* ── Pending Approvals ───────────────────────────────────────── */

type PendingUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

const AdminApprovals = () => {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users/pending");
    if (res.ok) setUsers((await res.json()).users);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    setBusy(true);
    const res = await fetch(`/api/admin/users/${id}/approve`, { method: "POST" });
    if (res.ok) setUsers(u => u.filter(x => x.id !== id));
    setBusy(false);
  };

  const reject = async () => {
    if (!rejectId) return;
    setBusy(true);
    const res = await fetch(`/api/admin/users/${rejectId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) { setUsers(u => u.filter(x => x.id !== rejectId)); setRejectId(null); setReason(""); }
    setBusy(false);
  };

  const timeAgo = (iso: string) => {
    const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  return (
    <div style={{ padding: "32px 36px 56px" }}>
      <div className="eyebrow">People</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing:"-0.025em", margin: "6px 0 6px" }}>Pending approvals</h1>
      <p style={{ color:"var(--ink-3)", marginTop: 0, marginBottom: 24 }}>Review new accounts that registered via the open sign-up form.</p>

      {loading ? (
        <div style={{ color:"var(--ink-3)" }}>Loading…</div>
      ) : users.length === 0 ? (
        <div className="surface" style={{ padding: 48, textAlign:"center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>✓</div>
          <div style={{ fontWeight: 700 }}>No pending accounts</div>
          <p style={{ color:"var(--ink-3)", marginTop: 4, fontSize: 14 }}>All caught up.</p>
        </div>
      ) : (
        <div className="surface" style={{ overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color:"var(--ink-3)", textAlign:"left", fontSize: 11, textTransform:"uppercase", letterSpacing:".08em", background:"var(--bg-soft)" }}>
                <th style={{ padding:"12px 18px" }}>User</th>
                <th>Role</th>
                <th>Requested</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderTop: i ? "1px solid var(--hairline)" : undefined }}>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", gap: 10, alignItems:"center" }}>
                      <Avatar name={u.name} size={32}/>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color:"var(--ink-3)" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="chip">{u.role}</span></td>
                  <td style={{ color:"var(--ink-3)" }}>{timeAgo(u.createdAt)}</td>
                  <td>
                    <div style={{ display:"flex", gap: 6, justifyContent:"flex-end", paddingRight: 18 }}>
                      <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => approve(u.id)}>
                        <Icon name="check" size={13}/> Approve
                      </button>
                      <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => { setRejectId(u.id); setReason(""); }}>
                        <Icon name="trash" size={13}/> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectId && (
        <div style={{ position:"fixed", inset:0, background:"rgba(8,32,24,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex: 30 }} onClick={() => setRejectId(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background:"var(--surface)", borderRadius: 18, padding: 28, width: 420, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin:"0 0 12px", fontSize: 18, fontWeight: 800 }}>Reject account</h3>
            <p style={{ color:"var(--ink-3)", fontSize: 13, margin:"0 0 14px" }}>Optionally provide a reason (sent to the user).</p>
            <textarea className="input" rows={3} placeholder="Reason (optional)…" value={reason} onChange={e => setReason(e.target.value)} style={{ resize:"vertical", marginBottom: 14 }} />
            <div style={{ display:"flex", gap: 8, justifyContent:"flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setRejectId(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background:"var(--danger, #e53e3e)" }} disabled={busy} onClick={reject}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Invitations ─────────────────────────────────────────────── */

type Invitation = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  course: { id: string; title: string } | null;
};

type CourseOption = { id: string; title: string };

const AdminInvitations = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "STUDENT", courseId: "" });
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [invRes, cRes] = await Promise.all([
      fetch("/api/admin/invitations"),
      fetch("/api/courses"),
    ]);
    if (invRes.ok) setInvitations((await invRes.json()).invitations);
    if (cRes.ok) setCourses((await cRes.json()).courses);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    setFormError("");
    if (!form.email) { setFormError("Email is required"); return; }
    setSending(true);
    const res = await fetch("/api/admin/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        name: form.name || undefined,
        role: form.role,
        courseId: form.courseId || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error || "Failed to send"); setSending(false); return; }
    setInvitations(inv => [data.invitation, ...inv]);
    setForm({ email: "", name: "", role: "STUDENT", courseId: "" });
    setShowForm(false);
    setSending(false);
  };

  const revoke = async (id: string) => {
    const res = await fetch(`/api/admin/invitations/${id}`, { method: "DELETE" });
    if (res.ok) setInvitations(inv => inv.map(x => x.id === id ? { ...x, status: "REVOKED" } : x));
  };

  const statusColor = (s: string) => {
    if (s === "PENDING") return { background:"color-mix(in oklch, var(--brand-500) 14%, transparent)", color:"var(--brand-800)", borderColor:"transparent" };
    if (s === "ACCEPTED") return { background:"color-mix(in oklch, var(--brand-700) 14%, transparent)", color:"var(--brand-900)", borderColor:"transparent" };
    return { background:"color-mix(in oklch, var(--ink-3) 14%, transparent)", color:"var(--ink-3)", borderColor:"transparent" };
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });

  return (
    <div style={{ padding: "32px 36px 56px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom: 24 }}>
        <div>
          <div className="eyebrow">People</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing:"-0.025em", margin: "6px 0 6px" }}>Invitations</h1>
          <p style={{ color:"var(--ink-3)", marginTop: 0 }}>Invite students or teachers directly — they skip the approval queue.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          <Icon name="mail" size={14}/> Send invitation
        </button>
      </div>

      {showForm && (
        <div className="surface" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>New invitation</div>
          {formError && <div style={{ color:"var(--danger, #e53e3e)", marginBottom: 10, fontSize: 13 }}>{formError}</div>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="student@example.com" />
            </div>
            <div>
              <label className="label">Name (optional)</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Pre-fill their name" />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="PARENT">Parent</option>
              </select>
            </div>
            <div>
              <label className="label">Enrol into course (optional)</label>
              <select className="input" value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}>
                <option value="">No course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"flex", gap: 8 }}>
            <button className="btn btn-primary" disabled={sending} onClick={send}>{sending ? "Sending…" : "Send"}</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color:"var(--ink-3)" }}>Loading…</div>
      ) : invitations.length === 0 ? (
        <div className="surface" style={{ padding: 48, textAlign:"center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>✉️</div>
          <div style={{ fontWeight: 700 }}>No invitations yet</div>
          <p style={{ color:"var(--ink-3)", fontSize: 14, marginTop: 4 }}>Send one above.</p>
        </div>
      ) : (
        <div className="surface" style={{ overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color:"var(--ink-3)", textAlign:"left", fontSize: 11, textTransform:"uppercase", letterSpacing:".08em", background:"var(--bg-soft)" }}>
                <th style={{ padding:"12px 18px" }}>Recipient</th>
                <th>Role</th>
                <th>Course</th>
                <th>Status</th>
                <th>Expires</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv, i) => (
                <tr key={inv.id} style={{ borderTop: i ? "1px solid var(--hairline)" : undefined }}>
                  <td style={{ padding:"12px 18px" }}>
                    <div style={{ fontWeight: 600 }}>{inv.name || "—"}</div>
                    <div style={{ fontSize: 11, color:"var(--ink-3)" }}>{inv.email}</div>
                  </td>
                  <td><span className="chip">{inv.role}</span></td>
                  <td style={{ color:"var(--ink-3)", fontSize: 12 }}>{inv.course?.title || "—"}</td>
                  <td><span className="chip" style={statusColor(inv.status)}>{inv.status}</span></td>
                  <td style={{ color:"var(--ink-3)", fontSize: 12 }}>{formatDate(inv.expiresAt)}</td>
                  <td style={{ textAlign:"right", paddingRight: 18 }}>
                    {inv.status === "PENDING" && (
                      <button className="btn btn-ghost btn-sm" style={{ color:"var(--danger, #e53e3e)" }} onClick={() => revoke(inv.id)}>
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ── Admin Courses ────────────────────────────────────────────── */

type AdminCourse = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  createdAt: string;
  owner: { id: string; name: string };
  _count: { enrolments: number; modules: number };
};

const AdminCourses = () => {
  const router = useRouter();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", coverUrl: "", isPublished: false });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/courses");
    if (res.ok) setCourses((await res.json()).courses);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setFormError("");
    if (!form.title.trim() || !form.description.trim()) { setFormError("Title and description are required"); return; }
    setCreating(true);
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, description: form.description, coverUrl: form.coverUrl || undefined, isPublished: form.isPublished }),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error || "Failed to create"); setCreating(false); return; }
    setCourses(c => [data.course, ...c]);
    setForm({ title: "", description: "", coverUrl: "", isPublished: false });
    setShowForm(false);
    setCreating(false);
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
    if (res.ok) setCourses(c => c.filter(x => x.id !== id));
  };

  const togglePublish = async (course: AdminCourse) => {
    const res = await fetch(`/api/courses/${course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !course.isPublished }),
    });
    if (res.ok) {
      const { course: updated } = await res.json();
      setCourses(c => c.map(x => x.id === updated.id ? updated : x));
    }
  };

  return (
    <div style={{ padding: "32px 36px 56px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom: 24 }}>
        <div>
          <div className="eyebrow">Content</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing:"-0.025em", margin: "6px 0 6px" }}>Courses</h1>
          <p style={{ color:"var(--ink-3)", marginTop: 0 }}>Create and manage courses. Teachers manage content inside each course.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          <Icon name="plus" size={14}/> New course
        </button>
      </div>

      {showForm && (
        <div className="surface" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>New course</div>
          {formError && <div style={{ color:"var(--danger, #e53e3e)", marginBottom: 10, fontSize: 13 }}>{formError}</div>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn:"1 / -1" }}>
              <label className="label">Title *</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Tafsīr of Sūrah al-Kahf" />
            </div>
            <div style={{ gridColumn:"1 / -1" }}>
              <label className="label">Description *</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the course…" style={{ resize:"vertical" }} />
            </div>
            <div>
              <label className="label">Cover image URL (optional)</label>
              <input className="input" value={form.coverUrl} onChange={e => setForm(f => ({ ...f, coverUrl: e.target.value }))} placeholder="https://…" />
            </div>
            <div style={{ display:"flex", alignItems:"flex-end", paddingBottom: 4 }}>
              <label style={{ display:"flex", alignItems:"center", gap: 8, cursor:"pointer", fontSize: 14, fontWeight: 600 }}>
                <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
                Publish immediately
              </label>
            </div>
          </div>
          <div style={{ display:"flex", gap: 8 }}>
            <button className="btn btn-primary" disabled={creating} onClick={create}>{creating ? "Creating…" : "Create course"}</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color:"var(--ink-3)" }}>Loading…</div>
      ) : courses.length === 0 ? (
        <div className="surface" style={{ padding: 48, textAlign:"center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📚</div>
          <div style={{ fontWeight: 700 }}>No courses yet</div>
          <p style={{ color:"var(--ink-3)", fontSize: 14, marginTop: 4 }}>Create your first course above.</p>
        </div>
      ) : (
        <div className="surface" style={{ overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color:"var(--ink-3)", textAlign:"left", fontSize: 11, textTransform:"uppercase", letterSpacing:".08em", background:"var(--bg-soft)" }}>
                <th style={{ padding:"12px 18px" }}>Course</th>
                <th>Owner</th>
                <th>Students</th>
                <th>Modules</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, i) => (
                <tr key={c.id} style={{ borderTop: i ? "1px solid var(--hairline)" : undefined }}>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ fontWeight: 700 }}>{c.title}</div>
                    <div style={{ fontSize: 11, color:"var(--ink-3)" }}>{c.slug}</div>
                  </td>
                  <td style={{ color:"var(--ink-3)" }}>{c.owner.name}</td>
                  <td>{c._count.enrolments}</td>
                  <td>{c._count.modules}</td>
                  <td>
                    <span className="chip" style={c.isPublished
                      ? { background:"color-mix(in oklch, var(--brand-500) 14%, transparent)", color:"var(--brand-800)", borderColor:"transparent" }
                      : { background:"color-mix(in oklch, var(--ink-3) 14%, transparent)", color:"var(--ink-3)", borderColor:"transparent" }
                    }>{c.isPublished ? "Published" : "Draft"}</span>
                  </td>
                  <td>
                    <div style={{ display:"flex", gap: 4, justifyContent:"flex-end", paddingRight: 18 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/courses/${c.id}`)}>Open</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => togglePublish(c)}>
                        {c.isPublished ? "Unpublish" : "Publish"}
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color:"var(--danger, #e53e3e)" }} onClick={() => deleteCourse(c.id)}>
                        <Icon name="trash" size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

type RoleCounts = { ADMIN: number; TEACHER: number; STUDENT: number; PARENT: number };
type PermissionRow = { id: string; key: string; description: string };

const ROLE_META: Record<keyof RoleCounts, { desc: string; color: string }> = {
  ADMIN: { desc: "All permissions · root access", color: "var(--accent-600)" },
  TEACHER: { desc: "Manages classes, lessons & quizzes for assigned courses", color: "var(--brand-700)" },
  STUDENT: { desc: "Default; individual permissions assignable per user", color: "var(--brand-600)" },
  PARENT: { desc: "Views progress for linked child accounts", color: "var(--ink-3)" },
};

const AdminPerms = () => {
  const router = useRouter();
  const [counts, setCounts] = useState<RoleCounts | null>(null);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/roles", { cache: "no-store" });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(d?.error ?? "Failed to load roles");
          return;
        }
        setCounts(d.counts as RoleCounts);
        setPermissions((d.permissions ?? []) as PermissionRow[]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ padding: "32px 36px 56px" }}>
      <div className="eyebrow">Access control</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.025em", margin: "6px 0 6px" }}>Roles &amp; permissions</h1>
      <p style={{ color: "var(--ink-3)", margin: "0 0 24px" }}>
        Roles are fixed (ADMIN / TEACHER / STUDENT / PARENT). Individual permissions can be granted per user from <a onClick={() => router.push("/admin/users")} style={{ color: "var(--brand-700)", cursor: "pointer" }}>Users → Permissions</a>.
      </p>

      {loading ? (
        <div style={{ color: "var(--ink-3)" }}>Loading…</div>
      ) : error ? (
        <div className="surface" style={{ padding: 24, color: "var(--danger, #e53e3e)" }}>{error}</div>
      ) : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0,1fr))", gap: 18, marginBottom: 28 }}>
            {(Object.keys(ROLE_META) as (keyof RoleCounts)[]).map(role => {
              const meta = ROLE_META[role];
              const count = counts?.[role] ?? 0;
              return (
                <div key={role} className="surface" style={{ padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <span className="chip" style={{ background: "color-mix(in oklch, " + meta.color + " 16%, transparent)", color: meta.color, borderColor: "transparent" }}>{role}</span>
                      <h3 style={{ margin: "10px 0 4px", fontSize: 18, fontWeight: 800 }}>{count.toLocaleString()} active</h3>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--ink-3)" }}>{meta.desc}</p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => router.push("/admin/users")}>Manage</button>
                  </div>
                </div>
              );
            })}
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 12px" }}>Permission catalogue</h2>
          <p style={{ color: "var(--ink-3)", fontSize: 13, margin: "0 0 14px" }}>
            Granular capabilities that can be granted to any user (admins inherit them all by default).
          </p>
          <div className="surface" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "var(--ink-3)", textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", background: "var(--bg-soft)" }}>
                  <th style={{ padding: "12px 18px" }}>Key</th>
                  <th style={{ padding: "12px 18px" }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p, i) => (
                  <tr key={p.id} style={{ borderTop: i ? "1px solid var(--hairline)" : undefined }}>
                    <td style={{ padding: "12px 18px", fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, monospace)", fontWeight: 600 }}>{p.key}</td>
                    <td style={{ padding: "12px 18px", color: "var(--ink-2)" }}>{p.description}</td>
                  </tr>
                ))}
                {permissions.length === 0 && (
                  <tr><td colSpan={2} style={{ padding: 18, color: "var(--ink-3)" }}>No permissions defined yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
type AskQuestion = {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
  replies: { id: string; body: string; sentAt: string; author: { id: string; name: string } }[];
};

const AdminAskUs = () => {
  const [questions, setQuestions] = useState<AskQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("OPEN");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);

  const load = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ask?status=${status}`);
      if (res.ok) setQuestions((await res.json()).questions);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  const sendReply = async (qId: string) => {
    const body = replyBody[qId]?.trim();
    if (!body) return;
    setSending(qId);
    try {
      const res = await fetch(`/api/ask/${qId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const { reply } = await res.json();
        setQuestions(qs => qs.map(q => q.id === qId ? { ...q, status: "ANSWERED", replies: [...q.replies, reply] } : q));
        setReplyBody(r => ({ ...r, [qId]: "" }));
      }
    } finally { setSending(null); }
  };

  return (
    <div style={{ padding: "32px 36px 56px" }}>
      <div className="eyebrow">Community</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing:"-0.025em", margin: "6px 0 24px" }}>Ask Us — Q&A</h1>

      <div style={{ display:"flex", gap: 8, marginBottom: 24 }}>
        {(["OPEN","ANSWERED","ARCHIVED"] as const).map(s => (
          <button key={s} className={filter === s ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color:"var(--ink-3)" }}>Loading…</div>
      ) : questions.length === 0 ? (
        <div className="surface" style={{ padding: 48, textAlign:"center", color:"var(--ink-3)" }}>
          No {filter.toLowerCase()} questions.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap: 12 }}>
          {questions.map(q => (
            <div key={q.id} className="surface" style={{ overflow:"hidden" }}>
              <div
                style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"18px 22px", cursor:"pointer" }}
                onClick={() => setExpanded(exp => exp === q.id ? null : q.id)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{q.subject}</span>
                    <span className="chip" style={{ fontSize: 10 }}>{q.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color:"var(--ink-3)" }}>
                    {q.name} · {q.email} · {new Date(q.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}
                  </div>
                </div>
                <span style={{ color:"var(--ink-3)", marginLeft: 12 }}>{expanded === q.id ? "▲" : "▼"}</span>
              </div>

              {expanded === q.id && (
                <div style={{ borderTop:"1px solid var(--hairline)", padding:"18px 22px" }}>
                  <p style={{ margin:"0 0 20px", lineHeight: 1.7, whiteSpace:"pre-wrap", color:"var(--ink-2)" }}>{q.body}</p>

                  {q.replies.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-3)", marginBottom: 10 }}>Replies</div>
                      {q.replies.map(r => (
                        <div key={r.id} style={{ background:"var(--bg-soft)", borderRadius: 10, padding:"14px 16px", marginBottom: 8 }}>
                          <div style={{ fontSize: 12, color:"var(--ink-3)", marginBottom: 6 }}>{r.author.name} · {new Date(r.sentAt).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}</div>
                          <p style={{ margin: 0, lineHeight: 1.65, whiteSpace:"pre-wrap", fontSize: 14 }}>{r.body}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="label">Reply</label>
                    <textarea
                      className="input"
                      rows={4}
                      value={replyBody[q.id] ?? ""}
                      onChange={e => setReplyBody(r => ({ ...r, [q.id]: e.target.value }))}
                      placeholder="Your reply to the questioner…"
                      style={{ resize:"vertical", marginBottom: 10 }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => sendReply(q.id)} disabled={sending === q.id || !replyBody[q.id]?.trim()}>
                      {sending === q.id ? "Sending…" : "Send reply"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminClient;
