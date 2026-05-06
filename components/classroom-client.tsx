"use client";

import { useState } from "react";
import { Icon, Avatar } from "./ui";
import { KhatamPattern } from "./motifs";

const participants = [
  { name: "Yusuf al-Madani", role: "teacher", speaking: true, hand: false },
  { name: "Aisha Khan", role: "you", hand: false, speaking: false },
  { name: "Bilal Hossain", role: "student", hand: true, speaking: false },
  { name: "Fatima Noor", role: "student", hand: false, speaking: false },
  { name: "Omar Siddiqui", role: "student", hand: false, speaking: false },
  { name: "Maryam Yusuf", role: "student", hand: false, speaking: false },
  { name: "Hamza Adel", role: "student", hand: true, speaking: false },
  { name: "Layla Iqbal", role: "student", hand: false, speaking: false },
];

const chat = [
  { who: "Yusuf al-Madani", role:"teacher", msg: "We'll start with verse 13 — keep your tafsīr open.", t: "7:02" },
  { who: "Bilal Hossain", role:"student", msg: "Jazākum Allāh khayran shaykh", t: "7:03" },
  { who: "Maryam Yusuf", role:"student", msg: "Quick q: what does “fitna” mean here specifically?", t: "7:08" },
  { who: "Yusuf al-Madani", role:"teacher", msg: "Great question — putting it in the queue.", t: "7:09" },
];

const slides = [
  { n: 1, title: "Sūrah al-Kahf · Lesson 7" },
  { n: 2, title: "The People of the Cave (Pt. 2)" },
  { n: 3, title: "Verse 13 — context & translation" },
  { n: 4, title: "Three lessons in tawakkul" },
  { n: 5, title: "Q&A · Reflection" },
];

const ClassroomClient = () => {
  const [tab, setTab] = useState("chat");
  const [muted, setMuted] = useState(true);
  const [cam, setCam] = useState(false);
  const [hand, setHand] = useState(false);
  const [recording, setRecording] = useState(true);
  const [slide, setSlide] = useState(3);
  const [pollOpen] = useState(true);
  const [pollAnswer, setPollAnswer] = useState<string | null>(null);
  const [time] = useState("32:14");
  const [chatInput, setChatInput] = useState("");

  return (
    <div className="app" style={{ background: "oklch(0.14 0.018 165)", color: "white", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ height: 58, padding: "0 20px", display:"flex", alignItems:"center", gap: 16, borderBottom:"1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.25)" }}>
        <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
          <span className="chip chip-live">● REC {time}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Tafsīr of Sūrah al-Kahf · Lesson 7</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>Sh. Yusuf al-Madani · 142 attending</div>
        </div>
        <div style={{ flex: 1 }}/>
        <span className="chip" style={{ background:"rgba(255,255,255,0.06)", color:"white", borderColor:"rgba(255,255,255,0.12)" }}><Icon name="users" size={12}/> 142</span>
        <button className="btn btn-ghost btn-sm" style={{ color:"white" }}><Icon name="settings" size={14}/></button>
        <button className="btn" style={{ background:"oklch(0.55 0.22 25)", color:"white" }}>Leave</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns: "1fr 320px", flex: 1, minHeight: 0 }}>
        {/* Stage */}
        <div style={{ display:"flex", flexDirection:"column", padding: 16, gap: 12, minWidth: 0 }}>
          <div style={{ flex: 1, display:"grid", gridTemplateColumns:"1.4fr .9fr", gap: 12, minHeight: 0 }}>
            {/* Speaker tile */}
            <div style={{ position:"relative", borderRadius: 18, overflow:"hidden", background: "linear-gradient(160deg, oklch(0.32 0.06 165), oklch(0.18 0.04 165))", display:"flex", alignItems:"center", justifyContent:"center", minHeight: 320 }}>
              <KhatamPattern opacity={0.10} color="white" />
              <div style={{ width: 130, height: 130, borderRadius: 999, background:"linear-gradient(135deg, oklch(0.55 0.13 165), oklch(0.30 0.08 165))", display:"flex", alignItems:"center", justifyContent:"center", fontSize: 44, fontWeight: 800, border:"4px solid oklch(0.55 0.18 70)", boxShadow:"0 0 0 8px rgba(245,180,80,0.20)" }}>YM</div>
              <div style={{ position:"absolute", bottom: 14, left: 14, display:"flex", gap: 8, alignItems:"center" }}>
                <span style={{ background:"rgba(0,0,0,0.55)", padding:"6px 12px", borderRadius: 999, fontSize: 13, fontWeight: 600 }}>Sh. Yusuf al-Madani</span>
                <span style={{ background:"rgba(255,255,255,0.16)", padding:"6px 8px", borderRadius: 999, color:"oklch(0.85 0.18 140)", fontSize: 11 }}>● speaking</span>
              </div>
              <div style={{ position:"absolute", top: 14, right: 14, padding:"6px 10px", borderRadius: 999, background:"rgba(0,0,0,0.45)", fontSize: 11, fontWeight: 600 }}>PINNED</div>
            </div>

            {/* Slides panel */}
            <div style={{ display:"flex", flexDirection:"column", gap: 8, minHeight: 0 }}>
              <div style={{ flex: 1, borderRadius: 18, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)", background:"white", color:"oklch(0.18 0.02 220)", display:"flex", flexDirection:"column" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #eee", display:"flex", alignItems:"center", gap: 10, fontSize: 12, fontWeight: 600 }}>
                  <Icon name="notes" size={14}/> Lesson notes · synced with teacher
                  <span style={{ flex: 1 }}/>
                  <span style={{ color:"var(--ink-3)" }}>{slide}/{slides.length}</span>
                </div>
                <div style={{ flex: 1, padding: 22, position:"relative", overflow:"hidden" }}>
                  <KhatamPattern opacity={0.04} color="var(--brand-700)" />
                  <div style={{ position:"relative" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing:".14em", textTransform:"uppercase", color:"var(--brand-700)" }}>Slide {slide}</div>
                    <h3 style={{ margin: "6px 0 14px", fontSize: 18, fontWeight: 800, letterSpacing:"-0.01em", color:"var(--ink)" }}>{slides[slide-1].title}</h3>
                    <p className="arabic" dir="rtl" style={{ fontSize: 22, fontWeight: 700, textAlign:"right", margin:"8px 0", color:"var(--ink)" }}>إِذْ أَوَى الْفِتْيَةُ إِلَى الْكَهْفِ</p>
                    <p style={{ fontSize: 12, color:"var(--ink-3)", margin: 0 }}>&ldquo;When the youths retreated to the cave…&rdquo;</p>
                    <ul style={{ marginTop: 14, paddingLeft: 18, fontSize: 13, color:"var(--ink-2)", lineHeight: 1.7 }}>
                      <li>Active retreat — they <i>chose</i> faith over status.</li>
                      <li>Tawakkul follows action, not laziness.</li>
                      <li>Allāh&apos;s mercy meets us where we go to seek Him.</li>
                    </ul>
                  </div>
                </div>
                <div style={{ padding: "8px 12px", borderTop:"1px solid #eee", display:"flex", gap: 4 }}>
                  {slides.map(s => (
                    <button key={s.n} onClick={() => setSlide(s.n)} style={{ flex: 1, height: 4, borderRadius: 999, border:"none", background: slide >= s.n ? "var(--brand-600)" : "var(--hairline-2)", cursor:"pointer" }}/>
                  ))}
                </div>
              </div>

              {/* Poll widget */}
              {pollOpen && (
                <div style={{ borderRadius: 16, padding: 14, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing:".1em", textTransform:"uppercase", color:"oklch(0.85 0.18 140)" }}><Icon name="poll" size={12}/> Live poll</div>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>89 / 142 voted</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>What does <i>fitna</i> mean in 18:13?</div>
                  {[["a","Trial / test"],["b","Punishment"],["c","Confusion"]].map(([k, v]) => (
                    <button key={k} onClick={() => setPollAnswer(k)} style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 12px", marginBottom: 6, borderRadius: 10, border:"1px solid rgba(255,255,255,0.12)", background: pollAnswer === k ? "oklch(0.55 0.13 162)" : "rgba(0,0,0,0.25)", color:"white", fontSize: 13, cursor:"pointer", fontFamily:"inherit" }}>
                      <b style={{ marginRight: 8 }}>{k.toUpperCase()}.</b> {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Filmstrip */}
          <div style={{ display:"flex", gap: 8, overflowX:"auto", paddingBottom: 4 }}>
            {participants.slice(0, 7).map((p, i) => (
              <div key={i} style={{ position:"relative", minWidth: 120, height: 80, borderRadius: 12, background:"linear-gradient(160deg, oklch(0.30 0.04 165), oklch(0.18 0.03 165))", display:"flex", alignItems:"center", justifyContent:"center", border: p.speaking ? "2px solid oklch(0.75 0.18 140)" : "1px solid rgba(255,255,255,0.08)" }}>
                <Avatar name={p.name} size={42}/>
                <span style={{ position:"absolute", bottom: 4, left: 6, fontSize: 10, fontWeight: 600, background:"rgba(0,0,0,0.55)", padding:"2px 6px", borderRadius: 6 }}>{p.name.split(" ")[0]}{p.role === "you" ? " (you)" : ""}</span>
                {p.hand && <span style={{ position:"absolute", top: 4, right: 4, background:"oklch(0.74 0.16 70)", color:"white", borderRadius: 6, padding: "2px 4px", fontSize: 10 }}>✋</span>}
                {p.role !== "teacher" && <span style={{ position:"absolute", top: 4, left: 6, color:"oklch(0.7 0.18 30)" }}><Icon name="mic-off" size={11}/></span>}
              </div>
            ))}
            <div style={{ minWidth: 80, height: 80, borderRadius: 12, border:"1px dashed rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize: 11, opacity: 0.6 }}>+135</div>
          </div>

          {/* Controls */}
          <div style={{ display:"flex", justifyContent:"center", gap: 10, padding: 8 }}>
            <button onClick={() => setMuted(m => !m)} className="btn" style={{ background: muted ? "oklch(0.55 0.22 25)" : "rgba(255,255,255,0.10)", color:"white", borderRadius: 999, padding: "12px 16px" }}><Icon name={muted ? "mic-off" : "mic"} size={16}/></button>
            <button onClick={() => setCam(c => !c)} className="btn" style={{ background: cam ? "rgba(255,255,255,0.10)" : "oklch(0.55 0.22 25)", color:"white", borderRadius: 999, padding: "12px 16px" }}><Icon name={cam ? "cam" : "cam-off"} size={16}/></button>
            <button onClick={() => setHand(h => !h)} className="btn" style={{ background: hand ? "oklch(0.74 0.16 70)" : "rgba(255,255,255,0.10)", color:"white", borderRadius: 999, padding: "12px 16px" }}><Icon name="hand" size={16}/> {hand ? "Hand raised" : "Raise hand"}</button>
            <button className="btn" style={{ background:"rgba(255,255,255,0.10)", color:"white", borderRadius: 999, padding: "12px 16px" }}><Icon name="chat" size={16}/> Chat</button>
            <button onClick={() => setRecording(r => !r)} className="btn" style={{ background:"rgba(255,255,255,0.10)", color:"white", borderRadius: 999, padding: "12px 16px" }}>
              <Icon name="rec" size={11}/>&nbsp;{recording ? "Stop rec" : "Record"}
            </button>
            <button className="btn" style={{ background:"rgba(255,255,255,0.10)", color:"white", borderRadius: 999, padding: "12px 16px" }}><Icon name="more" size={16}/></button>
          </div>
        </div>

        {/* Right rail */}
        <div style={{ borderLeft:"1px solid rgba(255,255,255,0.08)", display:"flex", flexDirection:"column", background:"rgba(0,0,0,0.22)" }}>
          <div style={{ display:"flex", padding: 6, gap: 4, borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
            {[["chat","Chat"],["qa","Q&A · 2"],["people","People"]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className="btn" style={{ flex: 1, background: tab===k ? "rgba(255,255,255,0.10)" : "transparent", color: tab===k ? "white" : "rgba(255,255,255,0.6)", borderRadius: 10, padding: "8px 10px", fontSize: 12 }}>{l}</button>
            ))}
          </div>

          {tab === "chat" && (
            <>
              <div style={{ flex: 1, padding: 14, overflowY:"auto", display:"flex", flexDirection:"column", gap: 14 }}>
                {chat.map((m, i) => (
                  <div key={i} style={{ display:"flex", gap: 10 }}>
                    <Avatar name={m.who} size={28} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{m.who.split(" ")[0]}</span>
                        {m.role === "teacher" && <span className="chip" style={{ background:"oklch(0.55 0.13 162)", color:"white", borderColor:"transparent", padding:"1px 6px", fontSize: 10 }}>Teacher</span>}
                        <span style={{ fontSize: 11, opacity: 0.5 }}>{m.t}</span>
                      </div>
                      <div style={{ fontSize: 13, color:"rgba(255,255,255,0.85)", marginTop: 2, lineHeight: 1.45 }}>{m.msg}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.08)", display:"flex", gap: 8 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Send a message…" style={{ flex: 1, padding: "9px 12px", borderRadius: 10, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", color:"white", fontFamily:"inherit", fontSize: 13, outline:"none" }}/>
                <button className="btn btn-primary btn-sm" style={{ borderRadius: 10 }}><Icon name="send" size={14}/></button>
              </div>
            </>
          )}

          {tab === "qa" && (
            <div style={{ flex: 1, padding: 14, overflowY:"auto", display:"flex", flexDirection:"column", gap: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.6, textTransform:"uppercase", letterSpacing:".1em" }}>Hands raised · in order</div>
              {[
                { name: "Bilal Hossain", q: "How does this verse relate to youth today?", up: 12, picked: false },
                { name: "Hamza Adel", q: "Was the cave a real place?", up: 7, picked: false },
                { name: "Maryam Yusuf", q: "Difference between fitna and ibtilāʾ?", up: 24, picked: true },
              ].map((q, i) => (
                <div key={i} style={{ padding: 12, background: q.picked ? "rgba(245,180,80,0.12)" : "rgba(255,255,255,0.05)", border:"1px solid " + (q.picked ? "oklch(0.74 0.16 70 / 0.5)" : "rgba(255,255,255,0.08)"), borderRadius: 12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                    <Avatar name={q.name} size={24}/>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{q.name.split(" ")[0]}</span>
                    {q.picked && <span className="chip" style={{ background:"oklch(0.74 0.16 70)", color:"white", borderColor:"transparent", padding:"1px 8px", fontSize: 10 }}>Picked</span>}
                    <span style={{ flex: 1 }}/>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>▲ {q.up}</span>
                  </div>
                  <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.45 }}>{q.q}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "people" && (
            <div style={{ flex: 1, padding: 14, overflowY:"auto", display:"flex", flexDirection:"column", gap: 6 }}>
              {participants.map((p, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap: 10, padding: "8px 10px", borderRadius: 10, background:"rgba(255,255,255,0.04)" }}>
                  <Avatar name={p.name} size={28}/>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                  {p.role === "teacher" && <span className="chip" style={{ background:"oklch(0.55 0.13 162)", color:"white", borderColor:"transparent", padding:"1px 6px", fontSize: 10 }}>Teacher</span>}
                  {p.hand && <span style={{ marginLeft: "auto", fontSize: 14 }}>✋</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ClassroomClient;
