"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPage() {
  const search = useSearchParams();
  const token = search.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Reset failed.");
      return;
    }
    setMsg(data.message ?? "Password updated.");
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
        <h1 className="serif" style={{ fontSize: 28 }}>Invalid reset link</h1>
        <p style={{ color: "var(--ink-3)" }}>No token was provided. Request a new reset link.</p>
        <p style={{ marginTop: 16 }}><a href="/auth/forgot" style={{ color: "var(--brand-700)" }}>Request a new link</a></p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h1 className="serif" style={{ fontSize: 28, marginBottom: 8 }}>Set a new password</h1>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <label>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-2)" }}>New password</span>
          <input
            className="input"
            type="password"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginTop: 6, width: "100%" }}
          />
        </label>
        <label>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-2)" }}>Confirm password</span>
          <input
            className="input"
            type="password"
            minLength={6}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={{ marginTop: 6, width: "100%" }}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy} style={{ justifyContent: "center" }}>
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
      {error && <p style={{ marginTop: 16, color: "#b91c1c", fontSize: 14 }}>{error}</p>}
      {msg && (
        <p style={{ marginTop: 16, color: "var(--ink-2)", fontSize: 14 }}>
          {msg} <a href="/auth/signin" style={{ color: "var(--brand-700)" }}>Sign in</a>
        </p>
      )}
    </div>
  );
}
