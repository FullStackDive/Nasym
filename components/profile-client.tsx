"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button, Card, Input } from "@/components/ui";

type ProfileData = {
  name: string;
  email: string;
  lessonsCompleted: number;
  quizzesTaken: number;
  avgScore: number;
};

export default function ProfileClient() {
  const { data: session, update } = useSession({ required: true });
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [name, setName] = useState("");
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [nameSaving, setNameSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    fetch("/api/me/profile")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d);
        setName(d.name ?? "");
      });
  }, []);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameSaving(true);
    setNameMsg(null);
    const res = await fetch("/api/me/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    setNameSaving(false);
    if (res.ok) {
      setNameMsg({ ok: true, text: "Name updated." });
      setProfile((p) => (p ? { ...p, name } : p));
      await update({ name });
    } else {
      const d = await res.json().catch(() => ({}));
      setNameMsg({ ok: false, text: d.error ?? "Update failed." });
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    setPwSaving(true);
    const res = await fetch("/api/me/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
    });
    setPwSaving(false);
    if (res.ok) {
      setPwMsg({ ok: true, text: "Password changed successfully." });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } else {
      const d = await res.json().catch(() => ({}));
      setPwMsg({ ok: false, text: d.error ?? "Password change failed." });
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-black">My Profile</h1>
      <p className="mt-1 text-slate-600">{session?.user?.email}</p>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: "Lessons completed", value: profile?.lessonsCompleted ?? "—" },
          { label: "Quizzes taken", value: profile?.quizzesTaken ?? "—" },
          { label: "Avg quiz score", value: profile ? `${Math.round(profile.avgScore)}%` : "—" }
        ].map((s) => (
          <Card key={s.label} className="p-5 text-center">
            <p className="text-3xl font-black text-brand-600">{s.value}</p>
            <p className="mt-1 text-sm text-slate-600">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Update name */}
      <Card className="mt-6 p-6">
        <h2 className="font-extrabold">Update name</h2>
        <form className="mt-4 space-y-3" onSubmit={saveName}>
          <div>
            <label className="text-sm font-semibold">Display name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} />
          </div>
          {nameMsg && (
            <p className={`text-sm ${nameMsg.ok ? "text-green-600" : "text-red-600"}`}>{nameMsg.text}</p>
          )}
          <Button disabled={nameSaving}>{nameSaving ? "Saving…" : "Save name"}</Button>
        </form>
      </Card>

      {/* Change password */}
      <Card className="mt-6 p-6">
        <h2 className="font-extrabold">Change password</h2>
        <form className="mt-4 space-y-3" onSubmit={savePassword}>
          <div>
            <label className="text-sm font-semibold">Current password</label>
            <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-semibold">New password</label>
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} />
          </div>
          <div>
            <label className="text-sm font-semibold">Confirm new password</label>
            <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required minLength={6} />
          </div>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.ok ? "text-green-600" : "text-red-600"}`}>{pwMsg.text}</p>
          )}
          <Button disabled={pwSaving}>{pwSaving ? "Saving…" : "Change password"}</Button>
        </form>
      </Card>
    </div>
  );
}
