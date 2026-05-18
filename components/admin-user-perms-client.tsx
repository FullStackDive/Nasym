"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { AdminShell } from "@/components/admin-client";

const allKeys = ["manage_users", "manage_news", "manage_posters", "manage_classes", "manage_lessons", "manage_quizzes", "manage_reports"] as const;
type PermissionKey = typeof allKeys[number];

const pageKeys = ["dashboard", "classes", "lessons", "news"] as const;
type PageKey = typeof pageKeys[number];
const PAGE_LABELS: Record<PageKey, string> = {
  dashboard: "Dashboard",
  classes: "Classes",
  lessons: "Lessons",
  news: "News",
};

export default function AdminUserPermsClient({ id }: { id: string }) {
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: "ADMIN" | "STUDENT" | "TEACHER" | "PARENT" } | null>(null);
  const [selected, setSelected] = useState<PermissionKey[]>([]);
  const [hidden, setHidden] = useState<PageKey[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${id}/permissions`)
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user);
        setSelected((d.permissionKeys ?? []) as PermissionKey[]);
        setHidden((d.hiddenPages ?? []) as PageKey[]);
      })
      .catch(() => setErr("Failed to load"));
  }, [id]);

  function togglePerm(k: PermissionKey) {
    setSelected((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }

  function toggleVisible(k: PageKey) {
    setHidden((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }

  async function save() {
    setSaving(true);
    setErr(null);
    setSaved(false);
    const res = await fetch(`/api/admin/users/${id}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionKeys: selected, hiddenPages: hidden })
    });
    setSaving(false);
    if (!res.ok) {
      setErr((await res.json().catch(() => ({})))?.error ?? "Save failed");
      return;
    }
    setSaved(true);
  }

  if (!user) return (
    <AdminShell active="users">
      <div className="mx-auto max-w-3xl px-4 py-10"><Card className="p-6">Loading…</Card></div>
    </AdminShell>
  );

  return (
    <AdminShell active="users">
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Permissions</h1>
          <p className="mt-1 text-sm text-slate-600">{user.name} • {user.email}</p>
        </div>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <p className="font-extrabold">Role</p>
          <Badge>{user.role}</Badge>
        </div>

        {user.role === "ADMIN" ? (
          <p className="mt-3 text-sm text-slate-700">
            This user is an <span className="font-semibold">ADMIN</span> and automatically has all permissions.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-slate-700">Admin permissions:</p>
            <div className="mt-4 space-y-3">
              {allKeys.map((k) => (
                <label key={k} className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 p-4">
                  <span className="font-semibold">{k}</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-green-600"
                    checked={selected.includes(k)}
                    onChange={() => togglePerm(k)}
                  />
                </label>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card className="mt-6 p-6">
        <p className="font-extrabold">Page visibility</p>
        <p className="mt-2 text-sm text-slate-700">
          Toggle which pages this user can see. Unchecked pages are hidden from the nav and blocked when visited directly.
        </p>
        <div className="mt-4 space-y-3">
          {pageKeys.map((k) => {
            const visible = !hidden.includes(k);
            return (
              <label key={k} className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 p-4">
                <div>
                  <span className="font-semibold">{PAGE_LABELS[k]}</span>
                  <span className="ml-2 text-xs text-slate-500">/{k}</span>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-green-600"
                  checked={visible}
                  onChange={() => toggleVisible(k)}
                />
              </label>
            );
          })}
        </div>
        {user.role === "ADMIN" && (
          <p className="mt-3 text-xs text-slate-500">
            Note: visibility rules also apply to admin accounts when browsing student pages.
          </p>
        )}
      </Card>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      {saved && <p className="mt-3 text-sm text-green-700">Saved.</p>}

      <div className="mt-5">
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      </div>
    </div>
    </AdminShell>
  );
}
