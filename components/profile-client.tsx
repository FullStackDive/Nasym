"use client";

import { useState } from "react";
import { Icon, AppBar } from "./ui";
import { Breeze, KhatamPattern, LeafSprig } from "./motifs";

type IconName = "home" | "book" | "video" | "users" | "user" | "newspaper" | "bell" | "settings" | "search" | "play" | "pause" | "mic" | "mic-off" | "cam" | "cam-off" | "hand" | "send" | "rec" | "chat" | "poll" | "notes" | "trophy" | "flame" | "star" | "leaf" | "calendar" | "clock" | "check" | "plus" | "filter" | "more" | "shield" | "globe" | "lock" | "mail" | "moon" | "arrow-right" | "trend" | "download" | "upload" | "edit" | "trash" | "eye" | "key" | "wind";

const badges: { name: string; desc: string; icon: IconName; color: string }[] = [
  { name: "Consistent", desc: "7-day reminders streak", icon: "flame", color: "var(--accent-600)" },
  { name: "Tafsīr 101", desc: "Finished Sūrah al-Kahf series", icon: "book", color: "var(--brand-700)" },
  { name: "Quiz champ", desc: "5 quizzes at 90%+", icon: "trophy", color: "var(--c-mid)" },
  { name: "Early bird", desc: "30 Fajr prayers logged", icon: "star", color: "var(--accent-700)" },
];

const ProfileClient = () => {
  const [tab, setTab] = useState("");
  return (
    <div className="app">
      <AppBar active={tab} onNav={setTab} />
      <div className="app-scroll">
        {/* Cover — coastal teal with breeze, blends to bg via gradient */}
        <div style={{ position: "relative", height: 200, overflow: "visible", background: "linear-gradient(170deg, var(--brand-700) 0%, var(--brand-800) 55%, var(--brand-900) 100%)" }}>
          <Breeze opacity={0.25} color="var(--mint-300)" />
          <div style={{ position: "absolute", top: 22, right: 28, opacity: 0.5 }}><LeafSprig size={42} color="var(--mint-300)"/></div>
          {/* Soft fade so the green doesn't hard-cut into the cream bg */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 90, background: "linear-gradient(to bottom, transparent, var(--bg) 95%)", pointerEvents: "none" }} />
          {/* Avatar — center on cover edge */}
          <div style={{ position: "absolute", bottom: -70, left: 36, zIndex: 3, width: 140, height: 140, borderRadius: 999, background: "linear-gradient(135deg, var(--c-mid), var(--brand-800))", border: "6px solid var(--surface)", boxShadow: "0 0 0 1px var(--hairline), 0 12px 36px rgba(40,82,96,0.32)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 50, fontWeight: 500, fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}>AK</div>
        </div>

        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px 64px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 24, paddingTop: 88, marginBottom: 28 }}>
            <div style={{ width: 140, flexShrink: 0 }} />
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap:"wrap" }}>
                <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em", margin: 0 }}>Aisha Khan</h1>
                <span className="chip chip-brand">Student · Level 7</span>
              </div>
              <p style={{ margin: "8px 0 0", color: "var(--ink-3)", fontSize: 14 }}>Joined Ramadan 1446 · Birmingham, UK · @aisha.k</p>
            </div>
            <div style={{ display: "flex", gap: 8, paddingBottom: 8 }}>
              <button className="btn btn-secondary"><Icon name="edit" size={14} /> Edit profile</button>
              <button className="btn btn-secondary" style={{ padding: "11px 13px" }}><Icon name="settings" size={14} /></button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr .9fr", gap: 22 }}>
            <div>
              <div className="surface" style={{ padding: 26 }}>
                <h2 className="serif" style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 500, letterSpacing:"-0.01em" }}>About</h2>
                <p className="serif" style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.65, fontSize: 17, fontWeight: 400 }}>
                  Sixth-form student trying to build a real relationship with the Qur&apos;an. Currently working through Sūrah al-Kahf and the Sīrah series. Loves writing reflections.
                </p>
                <hr className="divider" style={{ margin: "22px 0" }} />
                <h3 className="serif" style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 500 }}>Account access</h3>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--ink-3)" }}>Granular permissions assigned by an admin.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {([
                    ["View lessons", true],
                    ["Take quizzes", true],
                    ["Post in discussions", true],
                    ["Manage news", false],
                    ["Manage classes", false],
                    ["Moderate reports", false],
                  ] as [string, boolean][]).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: v ? "var(--mint-bg)" : "var(--bg-soft)", borderRadius: 12, fontSize: 13, border: "1px solid " + (v ? "var(--mint-300)" : "var(--hairline)") }}>
                      <span style={{ width: 18, height: 18, borderRadius: 999, background: v ? "var(--brand-700)" : "var(--hairline-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                        {v && <Icon name="check" size={11} stroke={3.5} />}
                      </span>
                      <span style={{ color: v ? "var(--ink)" : "var(--ink-3)", fontWeight: 600 }}>{k}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="surface" style={{ padding: 26, marginTop: 20 }}>
                <h2 className="serif" style={{ margin: "0 0 14px", fontSize: 22, fontWeight: 500, letterSpacing:"-0.01em" }}>Recent activity</h2>
                {([
                  ["completed", "Lesson 6 · Tafsīr al-Kahf", "+50 XP", "2h ago"],
                  ["passed", "Quiz: ʿAqīdah Basics", "9/10 · +120 XP", "Yesterday"],
                  ["earned", "Badge: Consistent", "+200 XP", "2 days ago"],
                  ["attended", "Live class: Sīrah Series · Ep. 11", "+80 XP", "Last week"],
                ] as [string, string, string, string][]).map(([verb, what, meta, when], i) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0", borderTop: i ? "1px solid var(--hairline)" : "none" }}>
                    <span style={{ width: 32, height: 32, borderRadius: 999, background: "var(--mint-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-700)", flexShrink: 0 }}><Icon name="check" size={15} /></span>
                    <div style={{ flex: 1, fontSize: 14 }}>
                      <span style={{ color: "var(--ink-3)" }}>{verb} </span>
                      <b className="serif" style={{ fontSize: 16, fontWeight: 500 }}>{what}</b>
                      <div style={{ color: "var(--ink-3)", fontSize: 12, marginTop: 3 }}>{meta} · {when}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {/* Streak */}
              <div className="surface" style={{ padding: 24, position: "relative", overflow: "hidden" }}>
                <Breeze opacity={0.1} color="var(--c-mid)" />
                <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ width: 56, height: 56, borderRadius: 16, background: "var(--accent-100)", display:"flex", alignItems:"center", justifyContent:"center", color: "var(--accent-700)" }}><Icon name="flame" size={28}/></span>
                  <div>
                    <div className="serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing:"-0.02em", color: "var(--brand-800)" }}>11-day streak</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Longest: 26 days</div>
                  </div>
                </div>
                <div style={{ position: "relative", marginTop: 20, display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: 4 }}>
                  {Array.from({ length: 28 }, (_, i) => {
                    const filled = i < 18;
                    const intensity = 35 + (i % 4) * 18;
                    return <div key={i} style={{ aspectRatio: "1/1", borderRadius: 4, background: filled ? `color-mix(in oklch, var(--brand-700) ${intensity}%, var(--mint-bg))` : "var(--hairline)" }} />;
                  })}
                </div>
              </div>

              {/* Badges */}
              <div className="surface" style={{ padding: 24, marginTop: 14 }}>
                <h3 className="serif" style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 500 }}>Badges · 4 of 18</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {badges.map((b) => (
                    <div key={b.name} style={{ padding: 16, background: "var(--bg-soft)", borderRadius: 14, border: "1px solid var(--hairline)" }}>
                      <span style={{ width: 38, height: 38, borderRadius: 12, background: "color-mix(in oklch, " + b.color + " 18%, var(--surface))", color: b.color, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={b.icon} size={20} /></span>
                      <div className="serif" style={{ marginTop: 12, fontSize: 16, fontWeight: 500, letterSpacing:"-0.005em" }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{b.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* My du'a */}
              <div className="surface" style={{ padding: 24, marginTop: 14, position: "relative", overflow: "hidden", background: "linear-gradient(160deg, var(--mint-bg), var(--surface))" }}>
                <KhatamPattern opacity={0.05} />
                <div style={{ position: "absolute", top: 16, right: 16 }}><LeafSprig size={28}/></div>
                <div style={{ position: "relative" }}>
                  <div className="eyebrow">My duʿāʾ</div>
                  <p className="arabic" dir="rtl" style={{ fontSize: 28, fontWeight: 700, margin: "12px 0 8px", textAlign: "right", lineHeight: 1.5, color: "var(--brand-800)" }}>رَّبِّ زِدْنِي عِلْمًا</p>
                  <p className="serif" style={{ fontSize: 14, fontStyle: "italic", color: "var(--ink-3)", margin: 0 }}>&ldquo;My Lord, increase me in knowledge.&rdquo;</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfileClient;
