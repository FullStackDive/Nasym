"use client";

import { useState } from "react";
import { Icon, Avatar, AppBar } from "./ui";
import { Breeze, LeafSprig } from "./motifs";

const lessons = [
  { id:1, title: "The People of the Cave (Pt. 2)", series: "Tafsīr al-Kahf", teacher: "Sh. Yusuf al-Madani", duration: "42 min", level: "Intermediate", new: true, watched: false, hue: "deep", progress: 0 },
  { id:2, title: "Year of Sorrow", series: "Sīrah", teacher: "Ust. Maryam Hassan", duration: "38 min", level: "Beginner", new: false, watched: true, hue: "mid", progress: 0 },
  { id:3, title: "Travelling and prayer", series: "Fiqh of Worship", teacher: "Sh. Ibrahim Daud", duration: "29 min", level: "Beginner", new: false, watched: false, hue: "camel", progress: 0 },
  { id:4, title: "On envy & the believing heart", series: "Akhlāq for teens", teacher: "Ust. Maryam Hassan", duration: "18 min", level: "Beginner", new: true, watched: false, hue: "mint", progress: 0 },
  { id:5, title: "The hijrah to Madinah", series: "Sīrah", teacher: "Ust. Maryam Hassan", duration: "44 min", level: "Beginner", new: false, watched: true, progress: 60, hue: "mid" },
  { id:6, title: "Names of Allah · ar-Raḥmān", series: "ʿAqīdah Basics", teacher: "Sh. Yusuf al-Madani", duration: "31 min", level: "Beginner", new: false, watched: false, hue: "deep", progress: 0 },
];

const series = ["All", "Tafsīr", "Sīrah", "Fiqh", "Akhlāq", "ʿAqīdah", "Adhkār"];
const levels = ["All levels", "Beginner", "Intermediate", "Advanced"];

const hueBg = (h: string) => h === "deep" ? "linear-gradient(135deg, var(--brand-700), var(--brand-900))"
  : h === "mid" ? "linear-gradient(135deg, var(--c-mid), var(--brand-700))"
  : h === "camel" ? "linear-gradient(135deg, var(--accent-500), var(--accent-600))"
  : "linear-gradient(135deg, var(--mint-300), var(--c-mid))";

const LessonsClient = () => {
  const [tab, setTab] = useState("lessons");
  const [view, setView] = useState("library");
  const [active, setActive] = useState(1);
  const [activeSeries, setActiveSeries] = useState("All");
  const [activeLevel, setActiveLevel] = useState("All levels");
  const [playing, setPlaying] = useState(false);

  if (view === "detail") {
    const lesson = lessons.find(l => l.id === active) || lessons[0];
    return (
      <div className="app">
        <AppBar active={tab} onNav={setTab} />
        <div className="app-scroll">
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 32px 56px" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setView("library")} style={{ marginBottom: 18 }}>← All lessons</button>
            <div style={{ display:"grid", gridTemplateColumns:"1.5fr .9fr", gap: 28 }}>
              <div>
                {/* Player */}
                <div style={{ position:"relative", borderRadius: 22, overflow:"hidden", aspectRatio:"16/9", background: hueBg(lesson.hue), display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Breeze opacity={0.25} color="white" />
                  <button onClick={() => setPlaying(p => !p)} style={{ width: 92, height: 92, borderRadius: 999, background:"var(--accent-500)", border:"none", color:"white", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 0 0 18px rgba(216,160,90,0.22)" }}>
                    <Icon name={playing ? "pause" : "play"} size={34}/>
                  </button>
                  <div style={{ position:"absolute", bottom: 0, left: 0, right: 0, padding: "60px 20px 18px", background:"linear-gradient(180deg, transparent, rgba(0,0,0,0.55))", color:"white" }}>
                    <div style={{ height: 4, background:"rgba(255,255,255,0.22)", borderRadius: 999 }}>
                      <div style={{ width:"34%", height:"100%", background:"var(--accent-500)", borderRadius: 999 }}/>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop: 6, fontSize: 12, opacity: 0.85 }}>
                      <span>14:21</span><span>{lesson.duration}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 26 }}>
                  <span className="chip chip-mint">{lesson.series}</span>
                  <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, letterSpacing:"-0.02em", margin: "12px 0 8px", lineHeight: 1.1 }}>{lesson.title}</h1>
                  <div style={{ display:"flex", alignItems:"center", gap: 12, color:"var(--ink-3)", fontSize: 13 }}>
                    <Avatar name={lesson.teacher} size={28}/>
                    <span style={{ fontWeight: 600, color:"var(--ink-2)" }}>{lesson.teacher}</span>
                    <span className="divider-dot"/><span><Icon name="clock" size={11}/> {lesson.duration}</span>
                    <span className="divider-dot"/><span>{lesson.level}</span>
                  </div>
                  <p className="serif" style={{ marginTop: 20, fontSize: 17, lineHeight: 1.65, color:"var(--ink-2)", fontWeight: 400 }}>
                    A continuation of our walk through Sūrah al-Kahf. We unpack verse 13 — the active retreat of the youth, what tawakkul looks like for someone your age, and three takeaways you can carry into this week.
                  </p>

                  <div style={{ marginTop: 22, display:"flex", gap: 10 }}>
                    <button className="btn btn-primary"><Icon name="play" size={14}/> {lesson.progress ? "Resume" : "Start"} lesson</button>
                    <button className="btn btn-secondary"><Icon name="download" size={14}/> Save offline</button>
                    <button className="btn btn-ghost">Take notes</button>
                  </div>
                </div>

                <div style={{ marginTop: 30, borderBottom: "1px solid var(--hairline)", display:"flex", gap: 4 }}>
                  {["Notes","Transcript","Discussion · 12","Quiz"].map((t, i) => (
                    <button key={t} className="btn btn-ghost btn-sm" style={{ borderRadius: 0, borderBottom: i === 0 ? "2px solid var(--brand-700)" : "2px solid transparent", color: i === 0 ? "var(--brand-700)" : "var(--ink-3)", padding: "11px 14px" }}>{t}</button>
                  ))}
                </div>

                <div style={{ paddingTop: 22 }}>
                  <h3 className="serif" style={{ margin:"0 0 10px", fontSize: 20, fontWeight: 500 }}>Lesson notes</h3>
                  <div style={{ padding: "20px 22px", background:"var(--mint-bg)", borderRadius: 16, border:"1px solid var(--mint-300)" }}>
                    <p className="arabic" dir="rtl" style={{ fontSize: 26, fontWeight: 700, margin: 0, textAlign:"right", color:"var(--brand-800)" }}>إِذْ أَوَى الْفِتْيَةُ إِلَى الْكَهْفِ</p>
                    <p className="serif" style={{ fontSize: 14, color:"var(--ink-3)", margin:"8px 0 0", fontStyle:"italic" }}>&ldquo;When the youths retreated to the cave…&rdquo; (18:13)</p>
                  </div>
                  <ul className="serif" style={{ marginTop: 16, paddingLeft: 22, fontSize: 16, lineHeight: 1.8, color:"var(--ink-2)", fontWeight: 400 }}>
                    <li>Active retreat — choosing faith over status.</li>
                    <li>Tawakkul follows action, not laziness.</li>
                    <li>Allāh&apos;s mercy meets us where we go to seek Him.</li>
                  </ul>
                </div>
              </div>

              <div>
                <div className="surface" style={{ padding: 22 }}>
                  <h3 className="serif" style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 500 }}>Up next in this series</h3>
                  {lessons.slice(0, 4).map((l, i) => (
                    <button key={l.id} onClick={() => setActive(l.id)} style={{ display:"flex", gap: 12, alignItems:"center", padding: "12px 0", borderTop: i ? "1px solid var(--hairline)" : "none", width:"100%", background:"none", border: "none", borderTopWidth: i ? 1 : 0, borderTopStyle:"solid", textAlign:"left", cursor:"pointer", fontFamily:"inherit", color:"inherit" }}>
                      <div style={{ width: 80, height: 56, borderRadius: 10, background: hueBg(l.hue), flexShrink: 0 }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="serif" style={{ fontSize: 14, fontWeight: 500, color:"var(--ink)", lineHeight: 1.3 }}>{l.title}</div>
                        <div style={{ fontSize: 11, color:"var(--ink-3)", marginTop: 4 }}>{l.duration} · {l.series}</div>
                      </div>
                      {l.watched && <Icon name="check" size={14}/>}
                    </button>
                  ))}
                </div>
                <div className="surface" style={{ padding: 22, marginTop: 14 }}>
                  <h3 className="serif" style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 500 }}>Resources</h3>
                  {["Worksheet · The Cave (PDF)","Companion ayāt list","Vocabulary flashcards"].map((r, i) => (
                    <div key={r} style={{ padding: "12px 0", borderTop: i ? "1px solid var(--hairline)" : "none", display:"flex", alignItems:"center", gap: 10, fontSize: 13 }}>
                      <Icon name="download" size={14}/>{r}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filtered = lessons.filter(l => activeSeries === "All" || l.series.includes(activeSeries));
  return (
    <div className="app">
      <AppBar active={tab} onNav={setTab} />
      <div className="app-scroll">
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 32px 64px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom: 26 }}>
            <div>
              <div className="eyebrow">320 lessons · 8 series</div>
              <h1 className="serif" style={{ fontSize: 48, fontWeight: 500, letterSpacing:"-0.025em", margin: "8px 0 0" }}>Lessons library</h1>
              <p style={{ color:"var(--ink-3)", marginTop: 8, fontSize: 15 }}>Watch, take notes, and earn XP. Filter by series, level, or teacher.</p>
            </div>
            <div style={{ display:"flex", gap: 8 }}>
              <button className="btn btn-secondary"><Icon name="filter" size={14}/> Filters</button>
              <button className="btn btn-secondary">Recently added</button>
            </div>
          </div>

          <div style={{ display:"flex", gap: 8, flexWrap:"wrap", marginBottom: 12 }}>
            {series.map(s => (
              <button key={s} onClick={() => setActiveSeries(s)} className={"btn btn-sm " + (activeSeries === s ? "btn-primary" : "btn-secondary")}>{s}</button>
            ))}
          </div>
          <div style={{ display:"flex", gap: 8, marginBottom: 26 }}>
            {levels.map(s => (
              <button key={s} onClick={() => setActiveLevel(s)} className="btn btn-sm" style={{ background: activeLevel === s ? "var(--bg-soft)" : "transparent", color: activeLevel === s ? "var(--ink)" : "var(--ink-3)", borderColor: activeLevel === s ? "var(--hairline-2)" : "transparent" }}>{s}</button>
            ))}
          </div>

          {/* Featured */}
          <div className="surface-2" style={{ padding: 36, marginBottom: 30, position:"relative", overflow:"hidden", display:"grid", gridTemplateColumns:"1.4fr .9fr", gap: 32, alignItems:"center", background: "linear-gradient(160deg, var(--mint-bg), var(--surface))" }}>
            <Breeze opacity={0.15} color="var(--c-mid)" />
            <div style={{ position:"absolute", top: 30, right: 30, opacity: 0.4 }}><LeafSprig size={48}/></div>
            <div style={{ position:"relative" }}>
              <span className="chip chip-camel">Featured series</span>
              <h2 className="serif" style={{ fontSize: 40, fontWeight: 500, letterSpacing:"-0.025em", margin: "14px 0 12px", lineHeight: 1.05 }}>Akhlāq for teens — a 10-part journey</h2>
              <p className="serif" style={{ color:"var(--ink-2)", lineHeight: 1.55, margin: 0, maxWidth: 480, fontSize: 17, fontWeight: 400 }}>Short, honest lessons on character: from envy to forgiveness, friendship to family. Built for the way you actually live.</p>
              <div style={{ marginTop: 22, display:"flex", gap: 10 }}>
                <button className="btn btn-primary" onClick={() => setView("detail")}><Icon name="play" size={14}/> Start series</button>
                <button className="btn btn-ghost">View all 10 lessons</button>
              </div>
            </div>
            <div style={{ position:"relative", aspectRatio:"4/3", borderRadius: 18, background: "linear-gradient(135deg, var(--c-mid), var(--brand-800))", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Breeze opacity={0.3} color="white"/>
              <LeafSprig size={56} color="var(--mint-300)"/>
            </div>
          </div>

          {/* Grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 20 }}>
            {filtered.map(l => (
              <button key={l.id} onClick={() => { setActive(l.id); setView("detail"); }} className="card" style={{ overflow:"hidden", textAlign:"left", cursor:"pointer", padding: 0, fontFamily:"inherit", color:"inherit" }}>
                <div style={{ position:"relative", aspectRatio: "16/9", background: hueBg(l.hue) }}>
                  <Breeze opacity={0.3} color="white" />
                  <div style={{ position:"absolute", inset: 0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ width: 48, height: 48, borderRadius:999, background:"rgba(255,255,255,0.92)", color:"var(--brand-800)", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="play" size={20}/></span>
                  </div>
                  {l.new && <span className="chip chip-camel" style={{ position:"absolute", top: 12, left: 12 }}>NEW</span>}
                  {l.watched && <span className="chip" style={{ position:"absolute", top: 12, right: 12, background:"rgba(0,0,0,0.45)", color:"white", borderColor:"transparent" }}>✓ watched</span>}
                  <span style={{ position:"absolute", bottom: 12, right: 12, padding:"3px 9px", borderRadius: 6, background:"rgba(0,0,0,0.55)", color:"white", fontSize: 11, fontWeight: 600 }}>{l.duration}</span>
                  {l.progress > 0 && <div style={{ position:"absolute", bottom: 0, left: 0, right: 0, height: 3, background:"rgba(255,255,255,0.2)" }}><div style={{ width: `${l.progress}%`, height:"100%", background:"var(--accent-500)" }}/></div>}
                </div>
                <div className="card-pad">
                  <div className="eyebrow" style={{ color:"var(--ink-3)" }}>{l.series}</div>
                  <h3 className="serif" style={{ margin: "8px 0 6px", fontSize: 19, fontWeight: 500, letterSpacing:"-0.01em", lineHeight: 1.2 }}>{l.title}</h3>
                  <p style={{ margin: 0, color:"var(--ink-3)", fontSize: 12 }}>{l.teacher} · {l.level}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default LessonsClient;
