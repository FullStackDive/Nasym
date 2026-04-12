"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";

const allKeys = ["manage_users", "manage_news", "manage_posters", "manage_classes", "manage_lessons", "manage_quizzes", "manage_reports"] as const;
type PermissionKey = typeof allKeys[number];

export default function AdminUserPermsClient({ id }: { id: string }) {
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: "ADMIN" | "STUDENT" } | null>(null);
  const [selected, setSelected] = useState<PermissionKey[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${id}/permissions`)
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user);
        setSelected((d.permissionKeys ?? []) as PermissionKey[]);
      })
      .catch(() => setErr("Failed to load"));
  }, [id]);

  function toggle(k: PermissionKey) {
    setSelected((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }

  async function save() {
    setSaving(true);
    setErr(null);
    const res = await fetch(`/api/admin/users/${id}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionKeys: selected })
    });
    setSaving(false);
    if (!res.ok) {
      setErr((await res.json().catch(() => ({})))?.error ?? "Save failed");
      return;
    }
  }

  if (!user) return <div className="mx-auto max-w-3xl px-4 py-10"><Card className="p-6">Loading…</Card></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Permissions</h1>
          <p className="mt-1 text-sm text-slate-600">{user.name} • {user.email}</p>
        </div>
        <Link href="/admin/users"><Button variant="secondary">Back</Button></Link>
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
            <p className="mt-3 text-sm text-slate-700">Select permissions for this student:</p>
            <div className="mt-4 space-y-3">
              {allKeys.map((k) => (
                <label key={k} className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 p-4">
                  <span className="font-semibold">{k}</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-green-600"
                    checked={selected.includes(k)}
                    onChange={() => toggle(k)}
                  />
                </label>
              ))}
            </div>

            {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

            <div className="mt-5">
              <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
