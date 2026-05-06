"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon, Avatar, AppBar, Stat } from "./ui";

type IconName = "home" | "book" | "video" | "users" | "user" | "newspaper" | "bell" | "settings" | "search" | "play" | "pause" | "mic" | "mic-off" | "cam" | "cam-off" | "hand" | "send" | "rec" | "chat" | "poll" | "notes" | "trophy" | "flame" | "star" | "leaf" | "calendar" | "clock" | "check" | "plus" | "filter" | "more" | "shield" | "globe" | "lock" | "mail" | "moon" | "arrow-right" | "trend" | "download" | "upload" | "edit" | "trash" | "eye" | "key" | "wind";

type NavGroup = { group: string; items: [string, string, IconName][] };

const adminNav: NavGroup[] = [
  { group: "Overview", items: [["overview","Dashboard","home"],["analytics","Analytics","trend"]] },
  { group: "People", items: [["users","Users","users"],["approvals","Pending approvals","clock"],["invitations","Invitations","mail"],["perms","Roles & permissions","shield"],["reports","Reports & moderation","newspaper"]] },
  { group: "Content", items: [["courses","Courses","book"],["classes","Classes","video"],["lessons","Lessons","book"],["news","News & posters","newspaper"],["quizzes","Quizzes","check"]] },
  { group: "System", items: [["settings","Settings","settings"]] },
];

const Sparkline = ({ data, color = "var(--brand-600)" }: { data: number[]; color?: string }) => {
  const max = Math.max(...data);
  const w = 200, h = 60;
  const pts = data.map((d, i) => `${(i/(data.length-1))*w},${h - (d/max)*h*0.9 - 4}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width:"100%", height: 60 }}>
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts}/>
      <polyline fill={color} fillOpacity="0.10" stroke="none" points={`0,${h} ${pts} ${w},${h}`}/>
    </svg>
  );
};

const AdminShell = ({ active, onNav, children }: { active: string; onNav: (k: string) => void; children: ReactNode }) => (
  <div className="app">
    <AppBar active="" onNav={() => {}} role="ADMIN" showSearch={true} />
    <div style={{ display:"flex", minHeight: "calc(100vh - 72px)" }}>
      <div className="sidebar">
        {adminNav.map(g => (
          <div key={g.group}>
            <div className="group-label">{g.group}</div>
            {g.items.map(([k, label, icon]) => (
              <a key={k} className={active === k ? "active" : ""} onClick={() => onNav?.(k)}>
                <Icon name={icon} size={16}/> {label}
              </a>
            ))}
          </div>
        ))}
        <div style={{ flex: 1 }}/>
        <div style={{ padding: 12, background:"var(--bg-soft)", borderRadius: 12, border:"1px solid var(--hairline)", marginTop: 12 }}>
          <span className="chip chip-brand" style={{ marginBottom: 8 }}><Icon name="shield" size={11}/> Super admin</span>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>Imam Yusuf</div>
          <div style={{ fontSize: 11, color:"var(--ink-3)" }}>imam@nasym.org</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
    </div>
  </div>
);

const AdminClient = () => {
  const [view, setView] = useState("overview");

  if (view === "users")       return <AdminShell active="users"       onNav={setView}><AdminUsers /></AdminShell>;
  if (view === "approvals")   return <AdminShell active="approvals"   onNav={setView}><AdminApprovals /></AdminShell>;
  if (view === "invitations") return <AdminShell active="invitations" onNav={setView}><AdminInvitations /></AdminShell>;
  if (view === "courses")     return <AdminShell active="courses"     onNav={setView}><AdminCourses /></AdminShell>;
  if (view === "perms")       return <AdminShell active="perms"       onNav={setView}><AdminPerms /></AdminShell>;

  return (
    <AdminShell active="overview" onNav={setView}>
      <div style={{ padding: "32px 36px 56px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom: 24 }}>
          <div>
            <div className="eyebrow">Admin overview</div>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing:"-0.025em", margin: "6px 0 0" }}>Good morning, Imam Yusuf</h1>
            <p style={{ color:"var(--ink-3)", marginTop: 6 }}>Here&apos;s what&apos;s happening across Nasym Ur Rahmah today.</p>
          </div>
          <div style={{ display:"flex", gap: 8 }}>
            <button className="btn btn-secondary"><Icon name="download" size={14}/> Export report</button>
            <button className="btn btn-primary"><Icon name="plus" size={14}/> New post</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap: 14 }}>
          <Stat label="Active students" value="4,820" sub="↑ 312 this week" icon="users" />
          <Stat label="Live attendees today" value="612" sub="2 classes running" icon="video" />
          <Stat label="Lesson completions" value="1,247" sub="↑ 18% vs last week" icon="book" />
          <Stat label="Open reports" value="7" sub="3 awaiting review" icon="shield" />
        </div>

        {/* Chart + activity */}
        <div style={{ display:"grid", gridTemplateColumns:"1.4fr .9fr", gap: 18, marginTop: 18 }}>
          <div className="surface" style={{ padding: 24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Engagement · last 14 days</h3>
              <div style={{ display:"flex", gap: 6 }}>
                <button className="btn btn-sm" style={{ background:"var(--bg-soft)", color:"var(--ink)" }}>14d</button>
                <button className="btn btn-sm btn-ghost">30d</button>
                <button className="btn btn-sm btn-ghost">90d</button>
              </div>
            </div>
            <Sparkline data={[12,18,22,16,28,34,30,42,38,46,52,48,58,64]} />
            <div style={{ display:"grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 18 }}>
              <div><div className="eyebrow">Lesson views</div><div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>18,402</div><div style={{ fontSize: 12, color: "oklch(0.6 0.16 140)" }}>+24%</div></div>
              <div><div className="eyebrow">Quiz attempts</div><div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>3,118</div><div style={{ fontSize: 12, color: "oklch(0.6 0.16 140)" }}>+9%</div></div>
              <div><div className="eyebrow">Avg streak</div><div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>6.4 days</div><div style={{ fontSize: 12, color: "var(--ink-3)" }}>flat</div></div>
            </div>
          </div>

          <div className="surface" style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>Live moderation queue</h3>
            {([
              ["high","Reported comment in Sūrah al-Kahf live","2 min ago"],
              ["med","Spam profile flag","12 min ago"],
              ["low","Lesson rating dispute","42 min ago"],
            ] as [string, string, string][]).map(([sev, text, when], i) => (
              <div key={i} style={{ display:"flex", gap: 12, alignItems:"center", padding: "12px 0", borderTop: i ? "1px solid var(--hairline)" : "none" }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: sev === "high" ? "var(--danger)" : sev === "med" ? "var(--accent-600)" : "var(--ink-3)" }}/>
                <div style={{ flex: 1, fontSize: 13.5 }}>
                  <div style={{ fontWeight: 600 }}>{text}</div>
                  <div style={{ fontSize: 11, color:"var(--ink-3)" }}>{when}</div>
                </div>
                <button className="btn btn-ghost btn-sm">Review</button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" style={{ width:"100%", marginTop: 8 }}>View all reports</button>
          </div>
        </div>

        {/* Two columns: top content + recent users */}
        <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap: 18, marginTop: 18 }}>
          <div className="surface" style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>Top lessons this week</h3>
            <table style={{ width:"100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color:"var(--ink-3)", textAlign:"left", fontSize: 11, textTransform:"uppercase", letterSpacing:".08em" }}>
                  <th style={{ padding: "8px 0" }}>Lesson</th>
                  <th>Views</th>
                  <th>Completion</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {([
                  ["Year of Sorrow", "Sīrah", 1842, 78, 4.9],
                  ["The Cave (Pt. 2)", "Tafsīr", 1408, 64, 4.8],
                  ["Travelling and prayer", "Fiqh", 1107, 82, 4.7],
                  ["On envy", "Akhlāq", 990, 71, 4.9],
                ] as [string, string, number, number, number][]).map(([t, s, v, c, r], i) => (
                  <tr key={i} style={{ borderTop:"1px solid var(--hairline)" }}>
                    <td style={{ padding:"12px 0" }}>
                      <div style={{ fontWeight: 600 }}>{t}</div>
                      <div style={{ fontSize: 11, color:"var(--ink-3)" }}>{s}</div>
                    </td>
                    <td>{v.toLocaleString()}</td>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                        <div className="progress" style={{ width: 60 }}><i style={{ width: `${c}%` }}/></div>
                        <span style={{ color:"var(--ink-3)", fontSize: 11 }}>{c}%</span>
                      </div>
                    </td>
                    <td>★ {r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="surface" style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>New students · last 24h</h3>
            {([
              ["Bilal Hossain","bilal@…","UK"],
              ["Maryam Yusuf","maryam@…","UAE"],
              ["Hamza Adel","hamza@…","Egypt"],
              ["Sara Ahmed","sara@…","Canada"],
            ] as [string, string, string][]).map(([n, e, c], i) => (
              <div key={i} style={{ display:"flex", gap: 12, alignItems:"center", padding: "10px 0", borderTop: i ? "1px solid var(--hairline)" : "none" }}>
                <Avatar name={n} size={32}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{n}</div>
                  <div style={{ fontSize: 11, color:"var(--ink-3)" }}>{e} · {c}</div>
                </div>
                <button className="btn btn-ghost btn-sm">View</button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" style={{ width:"100%", marginTop: 8 }} onClick={() => setView("users")}>Manage all users</button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

/* Users list */
type AdminUser = { name: string; email: string; role: "STUDENT" | "ADMIN"; status: "ACTIVE" | "SUSPENDED" | "BANNED"; joined: string; level: number | string; perms: number };

const usersData: AdminUser[] = [
  { name:"Aisha Khan", email:"aisha@nasym.org", role:"STUDENT", status:"ACTIVE", joined:"Mar 2026", level: 7, perms: 0 },
  { name:"Bilal Hossain", email:"bilal@nasym.org", role:"STUDENT", status:"ACTIVE", joined:"Apr 2026", level: 4, perms: 0 },
  { name:"Maryam Yusuf", email:"maryam@nasym.org", role:"STUDENT", status:"ACTIVE", joined:"Apr 2026", level: 3, perms: 1 },
  { name:"Hamza Adel", email:"hamza@nasym.org", role:"STUDENT", status:"SUSPENDED", joined:"Jan 2026", level: 5, perms: 0 },
  { name:"Sara Ahmed", email:"sara@nasym.org", role:"STUDENT", status:"ACTIVE", joined:"Apr 2026", level: 2, perms: 0 },
  { name:"Yusuf al-Madani", email:"yusuf@nasym.org", role:"ADMIN", status:"ACTIVE", joined:"Aug 2025", level: "—", perms: 7 },
  { name:"Maryam Hassan", email:"mhassan@nasym.org", role:"STUDENT", status:"ACTIVE", joined:"Sep 2025", level: 9, perms: 3 },
  { name:"Omar Siddiqui", email:"omar@nasym.org", role:"STUDENT", status:"BANNED", joined:"Feb 2026", level: 1, perms: 0 },
];

const AdminUsers = () => {
  const [selected, setSelected] = useState<AdminUser | null>(null);
  return (
    <div style={{ padding: "32px 36px 56px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom: 22 }}>
        <div>
          <div className="eyebrow">People</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing:"-0.025em", margin: "6px 0 0" }}>Users · 4,820</h1>
          <p style={{ color:"var(--ink-3)", marginTop: 6 }}>Manage student & admin accounts, set permissions, suspend or ban as needed.</p>
        </div>
        <div style={{ display:"flex", gap: 8 }}>
          <button className="btn btn-secondary"><Icon name="upload" size={14}/> Import CSV</button>
          <button className="btn btn-primary"><Icon name="plus" size={14}/> New user</button>
        </div>
      </div>

      <div style={{ display:"flex", gap: 8, marginBottom: 18, alignItems:"center" }}>
        <div style={{ position:"relative", flex: 1, maxWidth: 360 }}>
          <span style={{ position:"absolute", left: 12, top: 11, color:"var(--ink-3)" }}><Icon name="search" size={16}/></span>
          <input className="input" placeholder="Search name or email…" style={{ paddingLeft: 36 }}/>
        </div>
        {["All","Students","Admins","Suspended","Banned"].map((f, i) => (
          <button key={f} className={"btn btn-sm " + (i === 0 ? "btn-secondary" : "btn-ghost")}>{f}</button>
        ))}
      </div>

      <div className="surface" style={{ padding: 0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color:"var(--ink-3)", textAlign:"left", fontSize: 11, textTransform:"uppercase", letterSpacing:".08em", background:"var(--bg-soft)" }}>
              <th style={{ padding: "12px 18px" }}><input type="checkbox"/></th>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Permissions</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usersData.map((u, i) => (
              <tr key={i} style={{ borderTop:"1px solid var(--hairline)" }}>
                <td style={{ padding: "12px 18px" }}><input type="checkbox"/></td>
                <td>
                  <div style={{ display:"flex", gap: 10, alignItems:"center" }}>
                    <Avatar name={u.name} size={32}/>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color:"var(--ink-3)" }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className={u.role === "ADMIN" ? "chip chip-camel" : "chip"}>{u.role}</span></td>
                <td>
                  <span className="chip" style={{
                    background: u.status === "ACTIVE" ? "color-mix(in oklch, var(--brand-500) 14%, transparent)" : u.status === "SUSPENDED" ? "color-mix(in oklch, var(--accent-500) 18%, transparent)" : "color-mix(in oklch, var(--danger) 14%, transparent)",
                    color: u.status === "ACTIVE" ? "var(--brand-800)" : u.status === "SUSPENDED" ? "var(--accent-700)" : "var(--danger)",
                    borderColor:"transparent"
                  }}>{u.status}</span>
                </td>
                <td><span style={{ fontSize: 12, color:"var(--ink-2)" }}>{u.perms === 7 ? "All" : u.perms === 0 ? "Default" : `${u.perms} granted`}</span></td>
                <td style={{ color:"var(--ink-3)" }}>{u.joined}</td>
                <td>
                  <div style={{ display:"flex", gap: 4, justifyContent:"flex-end" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelected(u)}>Permissions</button>
                    <button className="btn btn-ghost btn-sm"><Icon name="more" size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <PermsDrawer user={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

const ALL_PERMS: [string, string, string][] = [
  ["manage_users", "Manage users", "Create, edit, suspend, ban accounts."],
  ["manage_news", "Manage news", "Publish news, pin announcements."],
  ["manage_posters", "Manage posters", "Schedule homepage posters."],
  ["manage_classes", "Manage classes", "Schedule and run live classrooms."],
  ["manage_lessons", "Manage lessons", "Upload recordings, edit metadata."],
  ["manage_quizzes", "Manage quizzes", "Author and grade quizzes."],
  ["manage_reports", "Manage reports", "Resolve user reports & moderation."],
];

const PermsDrawer = ({ user, onClose }: { user: AdminUser; onClose: () => void }) => {
  const [perms, setPerms] = useState<string[]>(user.role === "ADMIN" ? ALL_PERMS.map(p => p[0]) : ["manage_news"]);
  const toggle = (k: string) => setPerms(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
  return (
    <div style={{ position:"fixed", inset: 0, background:"rgba(8,32,24,0.4)", display:"flex", justifyContent:"flex-end", zIndex: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 460, height:"100%", background:"var(--surface)", boxShadow:"-12px 0 40px -12px rgba(0,0,0,0.25)", overflow:"auto", display:"flex", flexDirection:"column" }}>
        <div style={{ padding: "20px 24px", borderBottom:"1px solid var(--hairline)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div className="eyebrow">Edit user</div>
            <h2 style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 800 }}>{user.name}</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "20px 24px", flex: 1 }}>
          <div style={{ display:"flex", gap: 14, alignItems:"center", marginBottom: 18 }}>
            <Avatar name={user.name} size={56}/>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{user.email}</div>
              <div style={{ fontSize: 12, color:"var(--ink-3)" }}>Joined {user.joined} · {user.role}</div>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color:"var(--ink-2)", textTransform:"uppercase", letterSpacing:".08em" }}>Account status</label>
            <div style={{ display:"flex", gap: 6, marginTop: 8 }}>
              {["ACTIVE","SUSPENDED","BANNED"].map(s => (
                <button key={s} className={"btn btn-sm " + (s === user.status ? "btn-primary" : "btn-secondary")} style={{ flex: 1 }}>{s}</button>
              ))}
            </div>
          </div>

          <hr className="divider" style={{ margin: "18px 0" }}/>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color:"var(--ink-2)", textTransform:"uppercase", letterSpacing:".08em" }}>Granular permissions</label>
            <p style={{ fontSize: 12, color:"var(--ink-3)", margin: "4px 0 12px" }}>Assign capabilities individually. Admins inherit all.</p>
            <div style={{ display:"flex", flexDirection:"column", gap: 8 }}>
              {ALL_PERMS.map(([k, name, desc]) => {
                const on = perms.includes(k);
                return (
                  <button key={k} onClick={() => toggle(k)} style={{ display:"flex", gap: 12, alignItems:"flex-start", padding: 14, background:"var(--bg-soft)", border:"1px solid " + (on ? "var(--brand-500)" : "var(--hairline)"), borderRadius: 12, textAlign:"left", cursor:"pointer", fontFamily:"inherit", color:"inherit", boxShadow: on ? "0 0 0 3px color-mix(in oklch, var(--brand-500) 14%, transparent)" : "none" }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: on ? "var(--brand-600)" : "var(--surface)", border:"1.5px solid " + (on ? "var(--brand-600)" : "var(--hairline-2)"), color:"white", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop: 2 }}>
                      {on && <Icon name="check" size={12} stroke={3.5}/>}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{name}</div>
                      <div style={{ fontSize: 12, color:"var(--ink-3)", marginTop: 2 }}>{desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: 18, borderTop:"1px solid var(--hairline)", display:"flex", gap: 8, justifyContent:"flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Save changes</button>
        </div>
      </div>
    </div>
  );
};

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

const AdminPerms = () => (
  <div style={{ padding: "32px 36px 56px" }}>
    <div className="eyebrow">Access control</div>
    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing:"-0.025em", margin: "6px 0 24px" }}>Roles & permissions</h1>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap: 18 }}>
      {([
        ["ADMIN","All permissions · root access","var(--accent-600)", 2],
        ["MODERATOR","Manage reports + news (custom role)", "var(--brand-700)", 4],
        ["TEACHER","Manage classes + lessons + quizzes", "var(--brand-600)", 12],
        ["STUDENT","Default; permissions assignable","var(--ink-3)", 4802],
      ] as [string, string, string, number][]).map(([role, desc, color, count]) => (
        <div key={role} className="surface" style={{ padding: 24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <span className="chip" style={{ background:"color-mix(in oklch, " + color + " 16%, transparent)", color, borderColor: "transparent" }}>{role}</span>
              <h3 style={{ margin: "10px 0 4px", fontSize: 18, fontWeight: 800 }}>{count.toLocaleString()} users</h3>
              <p style={{ margin: 0, fontSize: 13, color:"var(--ink-3)" }}>{desc}</p>
            </div>
            <button className="btn btn-ghost btn-sm">Edit</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);
export default AdminClient;
