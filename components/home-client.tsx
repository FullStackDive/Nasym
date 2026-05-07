"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, LogoMark, AppBar } from "./ui";
import { Breeze, KhatamPattern, LeafSprig } from "./motifs";

// TODO: replace with API fetch (e.g. GET /api/ayah/today)
const ayah = {
  arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
  translit: "Wa qul rabbi zidnī ʿilmā",
  meaning: "“My Lord, increase me in knowledge.”",
  ref: "Sūrah Ṭā Hā · 20:114",
};

// TODO: replace with API fetch (e.g. GET /api/classes/upcoming)
const upcoming = [
  { id: 1, title: "Tafsīr of Sūrah al-Kahf", teacher: "Sh. Yusuf al-Madani", time: "Today · 7:00 PM", live: true, students: 142 },
  { id: 2, title: "Sīrah Series — Year of Sorrow", teacher: "Ust. Maryam Hassan", time: "Tomorrow · 6:30 PM", live: false, students: 89 },
  { id: 3, title: "Fiqh of Worship for Youth", teacher: "Sh. Ibrahim Daud", time: "Fri · 8:00 PM", live: false, students: 211 },
];

// TODO: replace with API fetch (e.g. GET /api/posts?limit=3)
const dailyPosts = [
  { tag: "Reflection", title: "What “Rabbi yassir” really teaches us", meta: "5 min read · Mon" },
  { tag: "Hadith",     title: "The most beloved deeds are the consistent ones", meta: "Bukhari 6464 · Mon" },
  { tag: "Q&A",        title: "Can I make duʿāʾ in any language?", meta: "Answered by Sh. Yusuf · Sun" },
];

export default function HomeClient() {
  const [tab, setTab] = useState("home");
  const router = useRouter();

  return (
    <div className="app">
      <AppBar active={tab} onNav={setTab} showSearch />
      <div className="app-scroll">

        {/* HERO */}
        <section style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid var(--hairline)" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, var(--mint-bg) 0%, var(--bg) 60%, var(--bg) 100%)" }} />
          <Breeze opacity={0.35} color="var(--c-mid)" />
          <div style={{ position: "absolute", top: -80, right: -80, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in oklch, var(--accent-500) 22%, transparent), transparent 70%)" }} />

          <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "88px 32px 80px", display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 64, alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 14px 6px 6px", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--hairline)", marginBottom: 26 }}>
                <span style={{ width: 24, height: 24, borderRadius: 999, background: "var(--brand-700)", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="wind" size={13} /></span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", letterSpacing: "0.02em" }}>nasym · the gentle breeze of mercy</span>
              </div>
              <h1 className="serif" style={{ fontSize: 76, fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.0, margin: "8px 0 0", color: "var(--ink)" }}>
                Where the breeze<br />
                of <em style={{ color: "var(--brand-700)", fontStyle: "italic" }}>raḥmah</em> reaches<br />
                the <em style={{ color: "var(--accent-600)", fontStyle: "italic" }}>young heart</em>.
              </h1>
              <p style={{ marginTop: 28, fontSize: 18, lineHeight: 1.6, color: "var(--ink-2)", maxWidth: 520 }}>
                Live classrooms, recorded lessons, and daily reflections — taught with care, designed for the way you learn now.
              </p>
              <div style={{ marginTop: 36, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="btn btn-primary btn-lg" onClick={() => router.push("/auth/register")}>Begin your journey <Icon name="arrow-right" size={16} /></button>
                <button className="btn btn-secondary btn-lg" onClick={() => router.push("/lessons")}><Icon name="play" size={14} /> Watch a lesson</button>
              </div>
              <div style={{ marginTop: 44, display: "flex", gap: 40, color: "var(--ink-3)", fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
                <div><div className="serif" style={{ fontSize: 32, color: "var(--brand-800)", fontWeight: 500, letterSpacing: "-0.02em", textTransform: "none" }}>4,820</div>active students</div>
                <div><div className="serif" style={{ fontSize: 32, color: "var(--brand-800)", fontWeight: 500, letterSpacing: "-0.02em", textTransform: "none" }}>320+</div>lessons</div>
                <div><div className="serif" style={{ fontSize: 32, color: "var(--brand-800)", fontWeight: 500, letterSpacing: "-0.02em", textTransform: "none" }}>12</div>weekly live</div>
              </div>
            </div>

            {/* AYAH CARD */}
            <div style={{ position: "relative", padding: 4, borderRadius: 28, background: "linear-gradient(160deg, var(--mint-300), var(--accent-300))", boxShadow: "var(--shadow-3)" }}>
              <div style={{ background: "var(--surface)", borderRadius: 24, padding: 36, position: "relative", overflow: "hidden" }}>
                <KhatamPattern opacity={0.05} color="var(--brand-700)" />
                <div style={{ position: "absolute", top: 22, right: 22, opacity: 0.4 }}><LeafSprig size={36} /></div>
                <div style={{ position: "relative" }}>
                  <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent-500)" }} /> Āyah of the day
                  </div>
                  <p className="arabic" dir="rtl" style={{ fontSize: 46, fontWeight: 700, color: "var(--brand-800)", margin: "22px 0 14px", textAlign: "right", lineHeight: 1.4 }}>{ayah.arabic}</p>
                  <p className="serif" style={{ fontStyle: "italic", color: "var(--ink-3)", fontSize: 16, margin: 0, fontWeight: 500 }}>{ayah.translit}</p>
                  <p className="serif" style={{ marginTop: 16, fontSize: 22, color: "var(--ink)", lineHeight: 1.4, fontWeight: 500 }}>{ayah.meaning}</p>
                  <hr className="divider" style={{ margin: "24px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>{ayah.ref}</span>
                    <button className="btn btn-mint btn-sm" onClick={() => router.push("/reminders")}>Listen <Icon name="play" size={12} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* UPCOMING */}
        <section style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 32px 24px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <div className="eyebrow">Live this week</div>
              <h2 className="serif" style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.02em", margin: "8px 0 0" }}>Upcoming classes</h2>
            </div>
            <a onClick={() => router.push("/classes")} style={{ color: "var(--brand-700)", fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>See all <Icon name="arrow-right" size={12} /></a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {upcoming.map((c, i) => (
              <div key={c.id} className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: 148, position: "relative", background: i === 0 ? "linear-gradient(135deg, var(--brand-700), var(--brand-900))" : i === 1 ? "linear-gradient(135deg, var(--c-mid), var(--brand-700))" : "linear-gradient(135deg, var(--accent-500), var(--accent-600))" }}>
                  <Breeze opacity={0.3} color="white" />
                  {c.live && <span className="chip chip-live" style={{ position: "absolute", top: 14, left: 14 }}>LIVE NOW</span>}
                  <span style={{ position: "absolute", bottom: 14, left: 16, color: "white", fontSize: 12, fontWeight: 600, opacity: 0.9, letterSpacing: "0.04em" }}>{c.time.toUpperCase()}</span>
                  <span style={{ position: "absolute", top: 14, right: 14, color: "white", opacity: 0.7 }}><LeafSprig size={26} color="white" /></span>
                </div>
                <div className="card-pad" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <h3 className="serif" style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{c.title}</h3>
                  <p style={{ margin: "6px 0 18px", color: "var(--ink-3)", fontSize: 13 }}>{c.teacher}</p>
                  <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--ink-3)", display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="users" size={12} /> {c.students} enrolled</span>
                    <button onClick={() => router.push("/classes")} className={c.live ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}>{c.live ? "Join now" : "Reserve"}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* POSTS + ANNOUNCEMENTS */}
        <section style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.25fr .85fr", gap: 36 }}>
            <div>
              <div className="eyebrow">Daily on the journal</div>
              <h2 className="serif" style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.02em", margin: "8px 0 22px" }}>Today&apos;s reflections</h2>
              <div className="card" style={{ overflow: "hidden" }}>
                {dailyPosts.map((p, i) => (
                  <div key={i} onClick={() => router.push("/blog")} style={{ padding: "22px 24px", borderTop: i ? "1px solid var(--hairline)" : "none", display: "flex", gap: 20, alignItems: "center", cursor: "pointer" }}>
                    <div style={{ width: 78, height: 78, borderRadius: 14, background: i === 0 ? "var(--mint-bg)" : i === 1 ? "var(--accent-50)" : "var(--brand-50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: i === 0 ? "var(--brand-700)" : i === 1 ? "var(--accent-600)" : "var(--brand-800)" }}>
                      <Icon name={i === 0 ? "leaf" : i === 1 ? "book" : "chat"} size={26} stroke={1.4} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span className={i === 0 ? "chip chip-mint" : i === 1 ? "chip chip-camel" : "chip chip-brand"}>{p.tag}</span>
                      <h3 className="serif" style={{ margin: "10px 0 4px", fontSize: 20, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.25 }}>{p.title}</h3>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--ink-3)" }}>{p.meta}</p>
                    </div>
                    <Icon name="arrow-right" size={16} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="eyebrow">News</div>
              <h2 className="serif" style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.02em", margin: "8px 0 22px" }}>Announcements</h2>
              <div className="card card-pad" style={{ background: "linear-gradient(160deg, var(--brand-700), var(--brand-900))", color: "var(--surface)", border: "none", position: "relative", overflow: "hidden" }}>
                <Breeze opacity={0.18} color="white" />
                <div style={{ position: "relative" }}>
                  <span className="chip" style={{ background: "rgba(255,255,255,0.16)", color: "white", borderColor: "rgba(255,255,255,0.25)" }}>📌 Pinned</span>
                  <h3 className="serif" style={{ margin: "14px 0 8px", fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" }}>Ramadan 1447 schedule</h3>
                  <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>Nightly tafsīr, qiyām duʿāʾ sessions, and a youth I&apos;tikāf programme. Reservations open Monday.</p>
                  <button onClick={() => router.push("/news")} className="btn btn-mint btn-sm" style={{ marginTop: 18 }}>Read full notice <Icon name="arrow-right" size={12} /></button>
                </div>
              </div>
              <div className="card card-pad" style={{ marginTop: 14 }}>
                <span style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>3 days ago</span>
                <h3 className="serif" style={{ margin: "8px 0 6px", fontSize: 20, fontWeight: 500 }}>New series: Akhlāq for teens</h3>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-3)", lineHeight: 1.5 }}>10 short videos, every Sunday.</p>
              </div>
              <div className="card card-pad" style={{ marginTop: 14 }}>
                <span style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Last week</span>
                <h3 className="serif" style={{ margin: "8px 0 6px", fontSize: 20, fontWeight: 500 }}>Community ifṭār — Sat 14th</h3>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-3)", lineHeight: 1.5 }}>Volunteers needed.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <section style={{ background: "var(--brand-900)", color: "var(--surface)", padding: "56px 32px", position: "relative", overflow: "hidden" }}>
          <Breeze opacity={0.18} color="var(--mint-300)" />
          <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 22 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 38, height: 38, borderRadius: 12, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}><LogoMark size={32} /></span>
                <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: "0.04em" }}>NASYM UR RAHMAH</div>
              </div>
              <p style={{ marginTop: 16, color: "rgba(255,255,255,0.65)", fontSize: 13, maxWidth: 480 }}>An open Islamic learning space. Free for students. Built with sincerity.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => router.push("/auth/signin")} className="btn" style={{ background: "transparent", color: "var(--surface)", borderColor: "rgba(255,255,255,0.3)" }}>Sign in</button>
              <button onClick={() => router.push("/auth/register")} className="btn btn-mint">Create account</button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
