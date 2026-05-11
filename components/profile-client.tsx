"use client";

import { useEffect, useState, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Icon, AppBar } from "./ui";
import { Breeze, KhatamPattern, LeafSprig } from "./motifs";
import { useTheme, type Theme } from "./theme-provider";
import { DUAS, getDua } from "@/lib/duas";

type IconName = "home" | "book" | "video" | "users" | "user" | "newspaper" | "bell" | "settings" | "search" | "play" | "pause" | "mic" | "mic-off" | "cam" | "cam-off" | "hand" | "send" | "rec" | "chat" | "poll" | "notes" | "trophy" | "flame" | "star" | "leaf" | "calendar" | "clock" | "check" | "plus" | "filter" | "more" | "shield" | "globe" | "lock" | "mail" | "moon" | "arrow-right" | "trend" | "download" | "upload" | "edit" | "trash" | "eye" | "key" | "wind";

type Profile = { name: string; email: string; duaKey: string | null; lessonsCompleted: number; quizzesTaken: number; avgScore: number };
type Permissions = { permissions: string[]; role?: string };

const PERMISSION_LABELS: { key: string; label: string }[] = [
  { key: "manage_users", label: "Manage users" },
  { key: "manage_news", label: "Manage news" },
  { key: "manage_posters", label: "Manage posters" },
  { key: "manage_classes", label: "Manage classes" },
  { key: "manage_lessons", label: "Manage lessons" },
  { key: "manage_quizzes", label: "Manage quizzes" },
  { key: "manage_reports", label: "Moderate reports" },
];

function initials(name: string) {
  return name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?";
}

const ProfileClient = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tab, setTab] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [perms, setPerms] = useState<Permissions | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDua, setShowDua] = useState(false);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/me/profile");
    if (!res.ok) return;
    const data = await res.json();
    setProfile(data);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/profile");
      return;
    }
    if (status === "authenticated") {
      loadProfile();
      fetch("/api/me/permissions").then(r => r.ok ? r.json() : null).then(d => d && setPerms(d)).catch(() => {});
    }
  }, [status, loadProfile, router]);

  if (status === "loading" || !profile) {
    return (
      <div className="app">
        <AppBar active={tab} onNav={setTab} />
        <div className="app-scroll">
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "80px 32px", color: "var(--ink-3)" }}>Loading…</div>
        </div>
      </div>
    );
  }

  const role = (session?.user as { role?: string } | undefined)?.role ?? "STUDENT";
  const grantedSet = new Set(perms?.permissions ?? []);

  return (
    <div className="app">
      <AppBar active={tab} onNav={setTab} />
      <div className="app-scroll">
        <div style={{ position: "relative", height: 200, overflow: "visible", background: "linear-gradient(170deg, var(--brand-700) 0%, var(--brand-800) 55%, var(--brand-900) 100%)" }}>
          <Breeze opacity={0.25} color="var(--mint-300)" />
          <div style={{ position: "absolute", top: 22, right: 28, opacity: 0.5 }}><LeafSprig size={42} color="var(--mint-300)"/></div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 90, background: "linear-gradient(to bottom, transparent, var(--bg) 95%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -70, left: 36, zIndex: 3, width: 140, height: 140, borderRadius: 999, background: "linear-gradient(135deg, var(--c-mid), var(--brand-800))", border: "6px solid var(--surface)", boxShadow: "0 0 0 1px var(--hairline), 0 12px 36px rgba(40,82,96,0.32)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 50, fontWeight: 500, fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}>{initials(profile.name)}</div>
        </div>

        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px 64px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 24, paddingTop: 88, marginBottom: 28, flexWrap: "wrap" }}>
            <div style={{ width: 140, flexShrink: 0 }} />
            <div style={{ flex: 1, paddingBottom: 8, minWidth: 240 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap:"wrap" }}>
                <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em", margin: 0 }}>{profile.name}</h1>
                <span className="chip chip-brand">{role.charAt(0) + role.slice(1).toLowerCase()}</span>
              </div>
              <p style={{ margin: "8px 0 0", color: "var(--ink-3)", fontSize: 14 }}>{profile.email}</p>
            </div>
            <div style={{ display: "flex", gap: 8, paddingBottom: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowEdit(true)}><Icon name="edit" size={14} /> Edit profile</button>
              <button className="btn btn-secondary" style={{ padding: "11px 13px" }} onClick={() => setShowSettings(true)} aria-label="Settings"><Icon name="settings" size={14} /></button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr .9fr", gap: 22 }}>
            <div>
              <div className="surface" style={{ padding: 26 }}>
                <h2 className="serif" style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 500, letterSpacing:"-0.01em" }}>Learning stats</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  <StatBlock label="Lessons completed" value={profile.lessonsCompleted} />
                  <StatBlock label="Quizzes taken" value={profile.quizzesTaken} />
                  <StatBlock label="Avg score" value={`${profile.avgScore}%`} />
                </div>
                <hr className="divider" style={{ margin: "22px 0" }} />
                <h3 className="serif" style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 500 }}>Account access</h3>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--ink-3)" }}>Granular permissions assigned by an admin.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {PERMISSION_LABELS.map(({ key, label }) => {
                    const v = role === "ADMIN" || grantedSet.has(key);
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: v ? "var(--mint-bg)" : "var(--bg-soft)", borderRadius: 12, fontSize: 13, border: "1px solid " + (v ? "var(--mint-300)" : "var(--hairline)") }}>
                        <span style={{ width: 18, height: 18, borderRadius: 999, background: v ? "var(--brand-700)" : "var(--hairline-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                          {v && <Icon name="check" size={11} stroke={3.5} />}
                        </span>
                        <span style={{ color: v ? "var(--ink)" : "var(--ink-3)", fontWeight: 600 }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <div className="surface" style={{ padding: 24, position: "relative", overflow: "hidden", background: "linear-gradient(160deg, var(--mint-bg), var(--surface))" }}>
                <KhatamPattern opacity={0.05} />
                <div style={{ position: "absolute", top: 16, right: 16 }}><LeafSprig size={28}/></div>
                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div className="eyebrow">My duʿāʾ</div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowDua(true)} style={{ padding: "4px 10px", fontSize: 12 }}><Icon name="edit" size={12} /> Change</button>
                  </div>
                  {(() => {
                    const d = getDua(profile.duaKey);
                    return (
                      <>
                        <p className="arabic" dir="rtl" style={{ fontSize: 28, fontWeight: 700, margin: "12px 0 8px", textAlign: "right", lineHeight: 1.5, color: "var(--brand-800)" }}>{d.arabic}</p>
                        <p className="serif" style={{ fontSize: 14, fontStyle: "italic", color: "var(--ink-3)", margin: 0 }}>&ldquo;{d.english}&rdquo;</p>
                        <p style={{ marginTop: 6, fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>{d.citation}</p>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="surface" style={{ padding: 24, marginTop: 14 }}>
                <h3 className="serif" style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 500 }}>Quick actions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => router.push("/courses")}><Icon name="book" size={14} /> My courses</button>
                  <button className="btn btn-secondary" onClick={() => router.push("/dashboard")}><Icon name="trend" size={14} /> Dashboard</button>
                  <button className="btn btn-ghost" onClick={() => signOut({ callbackUrl: "/" })} style={{ color: "var(--accent-700)" }}>Sign out</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEdit && <EditProfileModal profile={profile} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); loadProfile(); }} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSaved={() => { setShowSettings(false); loadProfile(); }} />}
      {showDua && <DuaPickerModal current={profile.duaKey} onClose={() => setShowDua(false)} onSaved={() => { setShowDua(false); loadProfile(); }} />}
    </div>
  );
};

const DuaPickerModal = ({ current, onClose, onSaved }: { current: string | null; onClose: () => void; onSaved: () => void }) => {
  const [pick, setPick] = useState<string>(current ?? DUAS[0].key);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/me/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duaKey: pick }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save");
      return;
    }
    onSaved();
  }

  return (
    <Modal title="Pick your duʿāʾ" onClose={onClose}>
      <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 14px" }}>
        Shown on your profile card. Pick one that resonates with you right now.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "55vh", overflowY: "auto", paddingRight: 4 }}>
        {DUAS.map(d => (
          <label key={d.key} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: pick === d.key ? "var(--mint-bg)" : "var(--bg-soft)", borderRadius: 12, border: "1px solid " + (pick === d.key ? "var(--mint-300)" : "var(--hairline)"), cursor: "pointer" }}>
            <input type="radio" name="dua" checked={pick === d.key} onChange={() => setPick(d.key)} style={{ marginTop: 4, accentColor: "var(--brand-700)" }} />
            <div style={{ flex: 1 }}>
              <p className="arabic" dir="rtl" style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--brand-800)", textAlign: "right", lineHeight: 1.4 }}>{d.arabic}</p>
              <p className="serif" style={{ fontSize: 13, fontStyle: "italic", color: "var(--ink-2)", margin: "4px 0 2px" }}>&ldquo;{d.english}&rdquo;</p>
              <p style={{ margin: 0, fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>{d.citation}</p>
            </div>
          </label>
        ))}
      </div>
      {error && <div style={{ color: "var(--accent-700)", fontSize: 13, marginTop: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
      </div>
    </Modal>
  );
};

const StatBlock = ({ label, value }: { label: string; value: number | string }) => (
  <div style={{ padding: "14px 16px", background: "var(--bg-soft)", borderRadius: 12, border: "1px solid var(--hairline)" }}>
    <div className="serif" style={{ fontSize: 28, fontWeight: 500, color: "var(--brand-800)", letterSpacing: "-0.02em" }}>{value}</div>
    <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, marginTop: 4 }}>{label}</div>
  </div>
);

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div role="dialog" aria-modal="true" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,32,40,0.55)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "10vh 16px", overflowY: "auto" }}>
    <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: "var(--surface)", borderRadius: 18, border: "1px solid var(--hairline)", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
      <div style={{ padding: "20px 26px", borderBottom: "1px solid var(--hairline)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 className="serif" style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>{title}</h2>
        <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close" style={{ padding: "6px 10px" }}>✕</button>
      </div>
      <div style={{ padding: 26 }}>{children}</div>
    </div>
  </div>
);

const EditProfileModal = ({ profile, onClose, onSaved }: { profile: Profile; onClose: () => void; onSaved: () => void }) => {
  const [name, setName] = useState(profile.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) { setError("Name must be at least 2 characters"); return; }
    if (name === profile.name) { onClose(); return; }
    setSaving(true);
    const res = await fetch("/api/me/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save");
      return;
    }
    onSaved();
  }

  return (
    <Modal title="Edit profile" onClose={onClose}>
      <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600 }}>
          Display name
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600 }}>
          Email
          <input className="input" value={profile.email} disabled style={{ opacity: 0.6 }} />
          <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 400 }}>Email changes require admin approval.</span>
        </label>
        {error && <div style={{ color: "var(--accent-700)", fontSize: 13 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    </Modal>
  );
};

const SettingsModal = ({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) => {
  const [section, setSection] = useState<"password" | "preferences" | "appearance">("password");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { theme, setTheme, resolved } = useTheme();

  const [emailNotif, setEmailNotif] = useState(() => typeof window !== "undefined" ? localStorage.getItem("pref:email-notif") !== "0" : true);
  const [reminders, setReminders] = useState(() => typeof window !== "undefined" ? localStorage.getItem("pref:reminders") !== "0" : true);

  function savePreferences() {
    localStorage.setItem("pref:email-notif", emailNotif ? "1" : "0");
    localStorage.setItem("pref:reminders", reminders ? "1" : "0");
    setSuccess("Preferences saved");
    setTimeout(() => setSuccess(null), 2000);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (next.length < 6) { setError("New password must be at least 6 characters"); return; }
    if (next !== confirm) { setError("New password and confirmation do not match"); return; }
    setSaving(true);
    const res = await fetch("/api/me/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not update password");
      return;
    }
    setCurrent(""); setNext(""); setConfirm("");
    setSuccess("Password changed");
    onSaved();
  }

  return (
    <Modal title="Settings" onClose={onClose}>
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: "1px solid var(--hairline)" }}>
        {([["password", "Password"], ["preferences", "Preferences"], ["appearance", "Appearance"]] as const).map(([k, l]) => (
          <button key={k} type="button" className="btn btn-ghost btn-sm" onClick={() => { setSection(k); setError(null); setSuccess(null); }} style={{ borderRadius: 0, borderBottom: section === k ? "2px solid var(--brand-700)" : "2px solid transparent", color: section === k ? "var(--brand-700)" : "var(--ink-3)" }}>{l}</button>
        ))}
      </div>

      {section === "password" && (
        <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600 }}>
            Current password
            <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600 }}>
            New password
            <input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} minLength={6} required autoComplete="new-password" />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600 }}>
            Confirm new password
            <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} required autoComplete="new-password" />
          </label>
          {error && <div style={{ color: "var(--accent-700)", fontSize: 13 }}>{error}</div>}
          {success && <div style={{ color: "var(--brand-700)", fontSize: 13 }}>{success}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Updating…" : "Update password"}</button>
          </div>
        </form>
      )}

      {section === "preferences" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <ToggleRow label="Email notifications" desc="Receive emails for announcements & grades." checked={emailNotif} onChange={setEmailNotif} />
          <ToggleRow label="Daily reminders" desc="Habit reminders on the dashboard." checked={reminders} onChange={setReminders} />
          {success && <div style={{ color: "var(--brand-700)", fontSize: 13 }}>{success}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            <button type="button" className="btn btn-primary" onClick={savePreferences}>Save preferences</button>
          </div>
        </div>
      )}

      {section === "appearance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>
            Choose how the app looks. <strong>System</strong> follows your device setting (currently <em>{resolved}</em>).
          </p>
          {([["system", "System", "Match device setting"], ["light", "Light", "Always light"], ["dark", "Dark", "Always dark"]] as [Theme, string, string][]).map(([k, label, desc]) => (
            <label key={k} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: theme === k ? "var(--mint-bg)" : "var(--bg-soft)", borderRadius: 12, border: "1px solid " + (theme === k ? "var(--mint-300)" : "var(--hairline)"), cursor: "pointer" }}>
              <input type="radio" name="theme" checked={theme === k} onChange={() => setTheme(k)} style={{ accentColor: "var(--brand-700)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{desc}</div>
              </div>
            </label>
          ))}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      )}
    </Modal>
  );
};

const ToggleRow = ({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "12px 14px", background: "var(--bg-soft)", borderRadius: 12, border: "1px solid var(--hairline)", cursor: "pointer" }}>
    <div>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{desc}</div>
    </div>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--brand-700)" }} />
  </label>
);

export default ProfileClient;
