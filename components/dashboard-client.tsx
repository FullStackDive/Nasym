"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Avatar, AppBar, Stat } from "./ui";
import { Breeze, KhatamPattern, LeafSprig } from "./motifs";

const myClasses = [
  { id:1, title: "Tafsīr of Sūrah al-Kahf", progress: 64, next: "Lesson 7 · The People of the Cave (Pt. 2)", live: true, hue: "deep" },
  { id:2, title: "Sīrah Series", progress: 38, next: "Lesson 12 · The boycott in the valley", live: false, hue: "mid" },
  { id:3, title: "Fiqh of Worship", progress: 82, next: "Lesson 18 · Travelling and prayer", live: false, hue: "camel" },
];

const reminders = [
  { id:"fajr", label:"Fajr prayer", time:"5:14 AM", done: true },
  { id:"quran", label:"Read 1 page of Qur'an", time:"Anytime", done: true },
  { id:"dhuhr", label:"Dhuhr prayer", time:"12:48 PM", done: true },
  { id:"asr", label:"ʿAṣr prayer", time:"4:21 PM", done: false },
  { id:"dua", label:"Evening adhkār", time:"After Maghrib", done: false },
  { id:"isha", label:"ʿIshāʾ prayer", time:"8:32 PM", done: false },
];

const hueBg = (h: string) => h === "deep" ? "linear-gradient(135deg, var(--brand-700), var(--brand-900))"
  : h === "mid" ? "linear-gradient(135deg, var(--c-mid), var(--brand-700))"
  : "linear-gradient(135deg, var(--accent-500), var(--accent-600))";

const DashboardClient = () => {
  const router = useRouter();
  const [tab, setTab] = useState("dashboard");
  const [habits, setHabits] = useState(reminders);
  const done = habits.filter(h => h.done).length;
  return (
    <div className="app">
      <AppBar active={tab} onNav={setTab} />
      <div className="app-scroll">
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 32px 64px" }}>
          {/* Greeting */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom: 28 }}>
            <div>
              <div className="eyebrow">Assalāmu ʿalaykum</div>
              <h1 className="serif" style={{ fontSize: 48, fontWeight: 500, letterSpacing: "-0.02em", margin: "10px 0 0" }}>Welcome back, <em style={{ color:"var(--brand-700)" }}>Aisha</em></h1>
              <p style={{ color: "var(--ink-3)", marginTop: 8, fontSize: 15 }}>Your next live class starts in <b style={{ color:"var(--brand-700)" }}>2 hours 14 minutes</b>.</p>
            </div>
            <div style={{ display:"flex", gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => router.push("/classes")}><Icon name="calendar" size={14}/> My schedule</button>
              <button className="btn btn-primary" onClick={() => router.push("/classes")}><Icon name="video" size={14}/> Join class</button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            <Stat label="Lessons watched" value="42" sub="+6 this week" icon="book" />
            <Stat label="Quizzes passed" value="18 / 20" sub="avg score 84%" icon="check" />
            <Stat label="Streak" value="11 days" sub="keep it going" icon="flame" />
            <Stat label="XP earned" value="2,460" sub="Level 7 · Ṭālib" icon="trophy" />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1.4fr .9fr", gap: 22 }}>
            <div>
              {/* Continue learning */}
              <div className="surface" style={{ padding: 26 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom: 18 }}>
                  <h2 className="serif" style={{ margin: 0, fontSize: 26, fontWeight: 500, letterSpacing:"-0.01em" }}>Continue learning</h2>
                  <a onClick={() => router.push("/courses")} style={{ color:"var(--brand-700)", fontSize: 13, fontWeight: 600, cursor:"pointer" }}>All my classes →</a>
                </div>
                {myClasses.map((c, i) => (
                  <div key={c.id} style={{ display:"flex", gap: 18, alignItems:"center", padding: "16px 0", borderTop: i ? "1px solid var(--hairline)" : "none" }}>
                    <div style={{ width: 96, height: 72, borderRadius: 12, background: hueBg(c.hue), position:"relative", overflow:"hidden", flexShrink: 0 }}>
                      <Breeze opacity={0.3} color="white" />
                      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"white", opacity: 0.85 }}><LeafSprig size={22} color="white"/></div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display:"flex", gap: 10, alignItems:"center" }}>
                        <h3 className="serif" style={{ margin: 0, fontSize: 19, fontWeight: 500, letterSpacing:"-0.01em" }}>{c.title}</h3>
                        {c.live && <span className="chip chip-live">LIVE</span>}
                      </div>
                      <p style={{ margin: "4px 0 10px", color:"var(--ink-3)", fontSize: 13 }}>{c.next}</p>
                      <div className="progress" style={{ maxWidth: 360 }}><i style={{ width: `${c.progress}%` }} /></div>
                    </div>
                    <span className="serif" style={{ fontSize: 22, fontWeight: 500, color:"var(--brand-700)" }}>{c.progress}%</span>
                    <button onClick={() => router.push("/courses")} className={c.live ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}>{c.live ? "Join" : "Resume"}</button>
                  </div>
                ))}
              </div>

              {/* Today's reflection */}
              <div className="surface" style={{ padding: 26, marginTop: 22, position:"relative", overflow:"hidden" }}>
                <h2 className="serif" style={{ margin: "0 0 16px", fontSize: 26, fontWeight: 500, letterSpacing:"-0.01em" }}>Today&apos;s reflection</h2>
                <div style={{ position:"relative", padding: "26px 28px", borderRadius: 18, background: "linear-gradient(160deg, var(--mint-bg), var(--surface))", border: "1px solid var(--mint-300)", overflow:"hidden" }}>
                  <Breeze opacity={0.18} color="var(--c-mid)" />
                  <div style={{ position:"absolute", top: 18, right: 18 }}><LeafSprig size={32}/></div>
                  <div style={{ position:"relative", maxWidth: "82%" }}>
                    <span className="chip chip-mint">Reflection · 4 min read</span>
                    <h3 className="serif" style={{ margin: "12px 0 8px", fontSize: 26, fontWeight: 500, letterSpacing:"-0.015em", lineHeight: 1.2 }}>Patience is not a passive thing</h3>
                    <p className="serif" style={{ margin: 0, fontSize: 17, color:"var(--ink-2)", lineHeight: 1.55, fontWeight: 400 }}>
                      In Sūrah al-Baqarah, ṣabr is paired with prayer — two active forms of seeking help. Today, when something tests you, slow down for two seconds and breathe. That pause <i>is</i> ṣabr.
                    </p>
                    <button onClick={() => router.push("/blog")} className="btn btn-ghost btn-sm" style={{ marginTop: 14, padding: 0, color:"var(--brand-700)" }}>Continue reading <Icon name="arrow-right" size={12}/></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div>
              {/* Daily reminders */}
              <div className="surface" style={{ padding: 24 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                  <h2 className="serif" style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing:"-0.01em" }}>Today&apos;s reminders</h2>
                  <span className="chip chip-brand">{done} / {habits.length}</span>
                </div>
                <div style={{ marginTop: 14, display:"flex", flexDirection:"column", gap: 8 }}>
                  {habits.map(h => (
                    <button key={h.id} onClick={() => setHabits(prev => prev.map(p => p.id === h.id ? { ...p, done: !p.done } : p))}
                      style={{ display:"flex", alignItems:"center", gap: 12, padding: "11px 14px", background: h.done ? "var(--mint-bg)" : "var(--bg-soft)", border: "1px solid " + (h.done ? "var(--mint-300)" : "var(--hairline)"), borderRadius: 12, textAlign:"left", cursor:"pointer", fontFamily:"inherit", color:"inherit" }}>
                      <span style={{ width: 22, height: 22, borderRadius: 999, border: "2px solid " + (h.done ? "var(--brand-700)" : "var(--ink-3)"), display:"inline-flex", alignItems:"center", justifyContent:"center", background: h.done ? "var(--brand-700)" : "transparent", color:"white", flexShrink:0 }}>
                        {h.done && <Icon name="check" size={12} stroke={3}/>}
                      </span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, textDecoration: h.done ? "line-through" : "none", color: h.done ? "var(--ink-3)" : "var(--ink)" }}>{h.label}</span>
                      <span style={{ fontSize: 12, color:"var(--ink-3)" }}>{h.time}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Streak / XP */}
              <div className="surface" style={{ padding: 22, marginTop: 14, position:"relative", overflow:"hidden" }}>
                <KhatamPattern opacity={0.04} />
                <div style={{ position:"relative", display:"flex", gap: 18, alignItems:"center" }}>
                  <div style={{ width: 84, height: 84, borderRadius: 999, background: "conic-gradient(var(--brand-700) 0 75%, var(--hairline) 75% 100%)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <div style={{ width: 66, height: 66, borderRadius: 999, background: "var(--surface)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                      <span className="serif" style={{ fontSize: 22, fontWeight: 500, color:"var(--brand-800)" }}>L7</span>
                      <span style={{ fontSize: 9, color:"var(--ink-3)", letterSpacing:".14em", textTransform:"uppercase", fontWeight: 600 }}>Ṭālib</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 className="serif" style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>540 XP to Level 8 · Mubtadiʾ</h3>
                    <p style={{ margin: "4px 0 10px", fontSize: 12, color:"var(--ink-3)" }}>Earn XP by completing lessons, quizzes & habits.</p>
                    <div style={{ display:"flex", gap: 6 }}>
                      <span className="chip chip-camel"><Icon name="flame" size={12}/> 11d</span>
                      <span className="chip chip-mint"><Icon name="trophy" size={12}/> 4 badges</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mentor note */}
              <div className="surface" style={{ padding: 24, marginTop: 14, background: "linear-gradient(160deg, var(--accent-50), var(--surface))" }}>
                <div style={{ display:"flex", gap: 14 }}>
                  <Avatar name="Yusuf Madani" size={44} />
                  <div>
                    <h3 className="serif" style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>A note from Sh. Yusuf</h3>
                    <p className="serif" style={{ margin: "6px 0 0", fontSize: 15, color:"var(--ink-2)", lineHeight: 1.55, fontWeight: 400 }}>
                      MashāʾAllāh on your tafsīr quiz score. Try memorising the next 3 ayāt before Friday — they&apos;ll help with our discussion.
                    </p>
                  </div>
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
