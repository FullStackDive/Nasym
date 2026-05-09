"use client";

import { useState } from "react";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(data.message ?? data.error ?? "Done.");
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h1 className="serif" style={{ fontSize: 28, marginBottom: 8 }}>Reset your password</h1>
      <p style={{ color: "var(--ink-3)", marginBottom: 20 }}>
        Enter your email and we&rsquo;ll send a link to set a new password.
      </p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <label>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-2)" }}>Email</span>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ marginTop: 6, width: "100%" }}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy} style={{ justifyContent: "center" }}>
          {busy ? "Sending…" : "Send reset link"}
        </button>
      </form>
      {msg && <p style={{ marginTop: 16, color: "var(--ink-2)", fontSize: 14 }}>{msg}</p>}
      <p style={{ marginTop: 24, fontSize: 13 }}>
        <a href="/auth/signin" style={{ color: "var(--brand-700)" }}>Back to sign in</a>
      </p>
    </div>
  );
}
