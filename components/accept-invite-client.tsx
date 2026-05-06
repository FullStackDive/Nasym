"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { KhatamPattern, LeafSprig } from "./motifs";

type InviteInfo = {
  email: string;
  name: string | null;
  role: string;
  course: { id: string; title: string } | null;
  expiresAt: string;
};

const AcceptInviteClient = ({ token }: { token: string }) => {
  const router = useRouter();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/invitations/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setLoadError(data.error); return; }
        setInvite(data.invitation);
        if (data.invitation.name) setName(data.invitation.name);
      })
      .catch(() => setLoadError("Failed to load invitation"));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setSubmitting(true);

    const res = await fetch(`/api/invitations/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Something went wrong"); setSubmitting(false); return; }

    setDone(true);
    // Auto sign in
    const result = await signIn("credentials", { email: invite!.email, password, redirect: false });
    if (result?.ok) router.replace("/dashboard");
  };

  // Expired / invalid token
  if (loadError) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Invitation invalid</h2>
          <p style={{ color: "var(--ink-3)", fontSize: 14 }}>{loadError}</p>
          <a href="/auth/signin" className="btn btn-secondary" style={{ marginTop: 18, display: "inline-block" }}>
            Go to sign in
          </a>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="auth-page">
        <div style={{ color: "var(--ink-3)", fontSize: 15 }}>Loading invitation…</div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Account created!</h2>
          <p style={{ color: "var(--ink-3)", fontSize: 14 }}>Signing you in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-motif">
          <KhatamPattern opacity={0.22} color="var(--brand-700)" />
        </div>
        <div className="auth-brand-inner">
          <LeafSprig color="var(--brand-400)" style={{ width: 44, marginBottom: 16 }} />
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 500, margin: 0, color: "white" }}>Nasym-ur-Rahmah</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", marginTop: 10, fontSize: 15 }}>
            Rooted in knowledge. Guided by mercy.
          </p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="eyebrow" style={{ marginBottom: 4 }}>You&apos;re invited</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>Create your account</h2>

          <div style={{ background: "var(--bg-soft)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13 }}>
            <div style={{ marginBottom: 4 }}><b>Email:</b> {invite.email}</div>
            <div style={{ marginBottom: invite.course ? 4 : 0 }}><b>Role:</b> {invite.role.charAt(0) + invite.role.slice(1).toLowerCase()}</div>
            {invite.course && <div><b>Course:</b> {invite.course.title}</div>}
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="label">Your name *</label>
              <input
                className="input"
                required
                minLength={2}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="label">Password *</label>
              <input
                className="input"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="label">Confirm password *</label>
              <input
                className="input"
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
              />
            </div>

            {error && (
              <div style={{ color: "var(--danger, #e53e3e)", fontSize: 13, background: "color-mix(in oklch, var(--danger, #e53e3e) 10%, transparent)", padding: "10px 14px", borderRadius: 10 }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ marginTop: 4 }}>
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AcceptInviteClient;
