"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Icon, LogoMark } from "./ui";
import { Breeze, LeafSprig } from "./motifs";

type Mode = "signin" | "register";

const ERROR_MESSAGES: Record<string, string> = {
  ACCOUNT_PENDING_APPROVAL: "Your account is pending admin approval. You'll receive an email once it's active.",
  ACCOUNT_BANNED: "This account has been suspended.",
  ACCOUNT_REJECTED: "Your registration was not approved.",
  ACCOUNT_USE_GOOGLE: "This email was registered with Google. Use 'Continue with Google' to sign in.",
  CredentialsSignin: "Incorrect email or password.",
};

const AuthClient = ({ mode: initialMode = "signin" }: { mode?: Mode }) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const router = useRouter();

  const passwordStrength = Math.min(4, [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);

    if (mode === "register") {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      setBusy(false);
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }
      setInfo("Account created! An admin will review and activate it. You'll receive an email when it's ready.");
      return;
    }

    // Sign in
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setBusy(false);

    if (!result?.ok) {
      const code = result?.error ?? "CredentialsSignin";
      setError(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.CredentialsSignin);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogle() {
    setBusy(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  const googleEnabled = true; // button always shown; will show error if not configured server-side

  return (
    <div className="app" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
      {/* Left — brand panel */}
      <div style={{ position: "relative", background: "linear-gradient(165deg, var(--brand-700) 0%, var(--brand-900) 100%)", color: "white", padding: 56, display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
        <Breeze opacity={0.3} color="var(--mint-300)" />
        <div style={{ position: "absolute", top: 60, right: 60, opacity: 0.4 }}><LeafSprig size={56} color="var(--mint-300)" /></div>
        <div style={{ position: "absolute", bottom: 90, left: 80, opacity: 0.3 }}><LeafSprig size={36} color="var(--mint-300)" /></div>
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}><LogoMark size={36} /></span>
            <div className="serif" style={{ fontSize: 20, letterSpacing: "0.04em", fontWeight: 500 }}>NASYM UR RAHMAH</div>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <p className="arabic" dir="rtl" style={{ fontSize: 38, lineHeight: 1.5, margin: 0, fontWeight: 700, color: "var(--mint-300)" }}>وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ</p>
          <p className="serif" style={{ marginTop: 18, fontSize: 22, fontWeight: 500, color: "white", letterSpacing: "-0.01em", lineHeight: 1.4 }}>
            &ldquo;And We have not sent you except as a mercy to the worlds.&rdquo;
          </p>
          <p style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Sūrah al-Anbiyāʾ · 21:107</p>
        </div>
        <div style={{ position: "relative", display: "flex", gap: 16, color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
          <span>4,820 students</span><span>·</span><span>320+ lessons</span><span>·</span><span>Free for everyone</span>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ padding: 56, display: "flex", flexDirection: "column", justifyContent: "center", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
        <Breeze opacity={0.08} color="var(--c-mid)" />
        <div style={{ position: "relative", maxWidth: 420, width: "100%", margin: "0 auto" }}>
          <div style={{ display: "flex", padding: 4, background: "var(--bg-soft)", borderRadius: 999, marginBottom: 28, border: "1px solid var(--hairline)" }}>
            {([["signin", "Sign in"], ["register", "Create account"]] as [Mode, string][]).map(([k, l]) => (
              <button key={k} type="button" onClick={() => { setMode(k); setError(null); setInfo(null); }} style={{ flex: 1, padding: "10px 14px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13.5, background: mode === k ? "var(--surface)" : "transparent", color: mode === k ? "var(--brand-800)" : "var(--ink-3)", boxShadow: mode === k ? "var(--shadow-1)" : "none" }}>{l}</button>
            ))}
          </div>

          <h1 className="serif" style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
            {mode === "signin" ? "Welcome back" : "Begin your journey"}
          </h1>
          <p style={{ margin: "0 0 26px", color: "var(--ink-3)", fontSize: 14 }}>
            {mode === "signin" ? "Sign in to continue your studies." : "Free, forever. Built for sincere seekers."}
          </p>

          {error && (
            <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 16, fontSize: 13.5, color: "#b91c1c" }}>
              {error}
            </div>
          )}
          {info && (
            <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, marginBottom: 16, fontSize: 13.5, color: "#15803d" }}>
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <label style={{ display: "block" }}>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-2)" }}>Full name</span>
                <input className="input" placeholder="Aisha Khan" required minLength={2} maxLength={60} value={name} onChange={e => setName(e.target.value)} style={{ marginTop: 6, width: "100%" }} />
              </label>
            )}
            <label style={{ display: "block" }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-2)" }}>Email</span>
              <input className="input" type="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} style={{ marginTop: 6, width: "100%" }} />
            </label>
            <label style={{ display: "block" }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-2)" }}>Password</span>
              <input className="input" type="password" placeholder="••••••••" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} style={{ marginTop: 6, width: "100%" }} />
              {mode === "register" && password.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= passwordStrength ? (passwordStrength <= 1 ? "#ef4444" : passwordStrength <= 2 ? "#f59e0b" : "var(--brand-600)") : "var(--hairline)", transition: "background 0.2s" }} />
                  ))}
                </div>
              )}
            </label>

            {mode === "signin" && (
              <div style={{ textAlign: "right", marginTop: -6 }}>
                <a href="/auth/forgot" style={{ fontSize: 12, color: "var(--brand-700)" }}>Forgot password?</a>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"} {!busy && <Icon name="arrow-right" size={14} />}
            </button>
          </form>

          <div className="h-rule" style={{ margin: "26px 0" }}>or</div>
          <button type="button" className="btn btn-secondary" onClick={handleGoogle} disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
            <Icon name="globe" size={14} /> Continue with Google
          </button>

          <p style={{ marginTop: 22, fontSize: 12, color: "var(--ink-3)", textAlign: "center" }}>
            By {mode === "signin" ? "signing in" : "creating an account"} you agree to our <a style={{ color: "var(--brand-700)" }}>community guidelines</a>.
          </p>
        </div>
      </div>
    </div>
  );
};
export default AuthClient;
