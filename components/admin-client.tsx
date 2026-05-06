"use client";

import { ReactNode, useState } from "react";
import { Icon, Avatar, AppBar, Stat } from "./ui";

type IconName = "home" | "book" | "video" | "users" | "user" | "newspaper" | "bell" | "settings" | "search" | "play" | "pause" | "mic" | "mic-off" | "cam" | "cam-off" | "hand" | "send" | "rec" | "chat" | "poll" | "notes" | "trophy" | "flame" | "star" | "leaf" | "calendar" | "clock" | "check" | "plus" | "filter" | "more" | "shield" | "globe" | "lock" | "mail" | "moon" | "arrow-right" | "trend" | "download" | "upload" | "edit" | "trash" | "eye" | "key" | "wind";

type NavGroup = { group: string; items: [string, string, IconName][] };

const adminNav: NavGroup[] = [
  { group: "Overview", items: [["overview","Dashboard","home"],["analytics","Analytics","trend"]] },
  { group: "People", items: [["users","Users","users"],["perms","Roles & permissions","shield"],["reports","Reports & moderation","newspaper"]] },
  { group: "Content", items: [["classes","Classes","video"],["lessons","Lessons","book"],["news","News & posters","newspaper"],["quizzes","Quizzes","check"]] },
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

  if (view === "users") return <AdminShell active="users" onNav={setView}><AdminUsers /></AdminShell>;
  if (view === "perms") return <AdminShell active="perms" onNav={setView}><AdminPerms /></AdminShell>;

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
