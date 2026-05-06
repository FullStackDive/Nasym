"use client";

import { useState } from "react";
import { Icon, LogoMark } from "./ui";
import { Breeze, LeafSprig } from "./motifs";

type Mode = "signin" | "register";

const AuthClient = ({ mode: initialMode = "signin" }: { mode?: Mode }) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  return (
    <div className="app" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
      {/* Left — brand panel */}
      <div style={{ position: "relative", background: "linear-gradient(165deg, var(--brand-700) 0%, var(--brand-900) 100%)", color: "white", padding: 56, display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
        <Breeze opacity={0.3} color="var(--mint-300)" />
        <div style={{ position:"absolute", top: 60, right: 60, opacity: 0.4 }}><LeafSprig size={56} color="var(--mint-300)"/></div>
        <div style={{ position:"absolute", bottom: 90, left: 80, opacity: 0.3 }}><LeafSprig size={36} color="var(--mint-300)"/></div>
        <div style={{ position: "relative" }}>
          <div style={{ display:"flex", alignItems:"center", gap: 12 }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background:"var(--surface)", display:"flex", alignItems:"center", justifyContent:"center" }}><LogoMark size={36}/></span>
            <div className="serif" style={{ fontSize: 20, letterSpacing: "0.04em", fontWeight: 500 }}>NASYM UR RAHMAH</div>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <p className="arabic" dir="rtl" style={{ fontSize: 38, lineHeight: 1.5, margin: 0, fontWeight: 700, color: "var(--mint-300)" }}>وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ</p>
          <p className="serif" style={{ marginTop: 18, fontSize: 22, fontWeight: 500, color: "white", letterSpacing:"-0.01em", lineHeight: 1.4 }}>
            &ldquo;And We have not sent you except as a mercy to the worlds.&rdquo;
          </p>
          <p style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.6)", letterSpacing:"0.1em", textTransform:"uppercase", fontWeight: 600 }}>Sūrah al-Anbiyāʾ · 21:107</p>
        </div>
        <div style={{ position: "relative", display:"flex", gap: 16, color:"rgba(255,255,255,0.7)", fontSize: 13 }}>
          <span>4,820 students</span><span>·</span><span>320+ lessons</span><span>·</span><span>Free for everyone</span>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ padding: 56, display: "flex", flexDirection: "column", justifyContent: "center", background: "var(--bg)", position:"relative", overflow:"hidden" }}>
        <Breeze opacity={0.08} color="var(--c-mid)" />
        <div style={{ position:"relative", maxWidth: 420, width: "100%", margin: "0 auto" }}>
          <div style={{ display:"flex", padding: 4, background: "var(--bg-soft)", borderRadius: 999, marginBottom: 28, border: "1px solid var(--hairline)" }}>
            {([["signin","Sign in"],["register","Create account"]] as [Mode, string][]).map(([k, l]) => (
              <button key={k} onClick={() => setMode(k)} style={{ flex: 1, padding: "10px 14px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13.5, background: mode === k ? "var(--surface)" : "transparent", color: mode === k ? "var(--brand-800)" : "var(--ink-3)", boxShadow: mode === k ? "var(--shadow-1)" : "none" }}>{l}</button>
            ))}
          </div>
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 500, letterSpacing:"-0.02em", margin: "0 0 8px" }}>
            {mode === "signin" ? "Welcome back" : "Begin your journey"}
          </h1>
          <p style={{ margin: "0 0 26px", color: "var(--ink-3)", fontSize: 14 }}>
            {mode === "signin" ? "Sign in to continue your studies." : "Free, forever. Built for sincere seekers."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <label style={{ display: "block" }}>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing:"0.1em", textTransform:"uppercase", color: "var(--ink-2)" }}>Full name</span>
                <input className="input" placeholder="Aisha Khan" style={{ marginTop: 6 }} />
              </label>
            )}
            <label style={{ display: "block" }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing:"0.1em", textTransform:"uppercase", color: "var(--ink-2)" }}>Email</span>
              <input className="input" type="email" placeholder="you@example.com" style={{ marginTop: 6 }} />
            </label>
            <label style={{ display: "block" }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing:"0.1em", textTransform:"uppercase", color: "var(--ink-2)" }}>Password</span>
              <input className="input" type="password" placeholder="••••••••" style={{ marginTop: 6 }} />
              {mode === "register" && (
                <div style={{ marginTop: 8, display:"flex", gap: 4 }}>
                  {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= 3 ? "var(--brand-600)" : "var(--hairline)" }}/>)}
                </div>
              )}
            </label>
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent:"center", marginTop: 22 }}>
            {mode === "signin" ? "Sign in" : "Create account"} <Icon name="arrow-right" size={14}/>
          </button>

          <div className="h-rule" style={{ margin: "26px 0" }}>or</div>
          <button className="btn btn-secondary" style={{ width: "100%", justifyContent:"center" }}>
            <Icon name="globe" size={14}/> Continue with Google
          </button>

          <p style={{ marginTop: 22, fontSize: 12, color: "var(--ink-3)", textAlign: "center" }}>
            By {mode === "signin" ? "signing in" : "creating an account"} you agree to our <a style={{ color:"var(--brand-700)" }}>community guidelines</a>.
          </p>
        </div>
      </div>
    </div>
  );
};
export default AuthClient;
