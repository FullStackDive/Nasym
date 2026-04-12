"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Input } from "@/components/ui";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "STUDENT";
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  statusReason?: string | null;
  suspendedUntil?: string | null;
  createdAt: string;
};

function statusBadge(status: UserRow["status"]) {
  if (status === "ACTIVE") return <Badge>ACTIVE</Badge>;
  if (status === "SUSPENDED") return <Badge className="bg-amber-100 text-amber-900">SUSPENDED</Badge>;
  return <Badge className="bg-red-100 text-red-900">BANNED</Badge>;
}

export default function AdminUsersClient() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  // status form
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [status, setStatus] = useState<UserRow["status"]>("ACTIVE");
  const [reason, setReason] = useState("");
  const [until, setUntil] = useState(""); // local datetime string
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const res = await fetch("/api/admin/users");
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(d?.error ?? "Failed to load users");
      return;
    }
    setItems(d.users ?? []);
    setErr(null);
  }

  useEffect(() => {
    refresh();
  }, []);

  function pick(u: UserRow) {
    setSelected(u);
    setStatus(u.status);
    setReason(u.statusReason ?? "");
    // show in local datetime input if possible
    if (u.suspendedUntil) {
      const dt = new Date(u.suspendedUntil);
      const pad = (n: number) => String(n).padStart(2, "0");
      const local = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
      setUntil(local);
    } else {
      setUntil("");
    }
  }

  function clearPick() {
    setSelected(null);
    setStatus("ACTIVE");
    setReason("");
    setUntil("");
  }

  async function saveStatus() {
    if (!selected) return;
    setSaving(true);
    setErr(null);

    let suspendedUntil: string | null | undefined = null;
    if (status === "SUSPENDED") {
      if (!until) {
        setSaving(false);
        setErr("For SUSPENDED, please set 'Suspended until'.");
        return;
      }
      const iso = new Date(until).toISOString();
      suspendedUntil = iso;
    }

    const res = await fetch(`/api/admin/users/${selected.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        reason: reason || null,
        suspendedUntil: status === "SUSPENDED" ? suspendedUntil : null
      })
    });

    const d = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setErr(d?.error ?? "Update failed");
      return;
    }

    clearPick();
    await refresh();
  }

  const filtered = items.filter((u) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (u.email?.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q));
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Users</h1>
          <p className="mt-2 text-slate-600">Create users, assign permissions, and ban/suspend accounts.</p>
        </div>
        <Link href="/admin"><Button variant="secondary">Back</Button></Link>
      </div>

      {err && <Card className="mt-4 p-4 text-sm text-red-600">{err}</Card>}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-extrabold">All users</h2>
            <div className="w-full sm:w-64">
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search by name/email" />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => pick(u)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selected?.id === u.id ? "border-brand-300 bg-brand-50" : "border-slate-100 hover:bg-slate-50"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold">{u.name || "—"}</p>
                    <p className="text-sm text-slate-600">{u.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{u.role}</Badge>
                    {statusBadge(u.status)}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>Created: {new Date(u.createdAt).toLocaleString()}</span>
                  <span>
                    {u.status === "SUSPENDED" && u.suspendedUntil ? `Until: ${new Date(u.suspendedUntil).toLocaleString()}` : ""}
                  </span>
                </div>

                {u.statusReason ? (
                  <p className="mt-2 text-sm text-slate-700">Reason: {u.statusReason}</p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/admin/users/${u.id}/permissions`} onClick={(e) => e.stopPropagation()}>
                    <Button variant="secondary">Permissions</Button>
                  </Link>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-extrabold">Ban / Suspend</h2>
          <p className="mt-2 text-sm text-slate-600">Select a user on the left to manage status.</p>

          {!selected ? (
            <p className="mt-4 text-sm text-slate-600">No user selected.</p>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="font-extrabold">{selected.name || "—"}</p>
                <p className="text-sm text-slate-600">{selected.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{selected.role}</Badge>
                  {statusBadge(selected.status)}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Status</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="ACTIVE">ACTIVE (unban/unsuspend)</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="BANNED">BANNED</option>
                </select>
              </div>

              {status === "SUSPENDED" && (
                <div>
                  <label className="text-sm font-semibold">Suspended until</label>
                  <Input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
                  <p className="mt-1 text-xs text-slate-500">Set a future date/time. If time passes, user auto-reactivates.</p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold">Reason (optional)</label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., spam, inappropriate content" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={saveStatus} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button variant="secondary" onClick={clearPick}>Cancel</Button>
              </div>

              <p className="text-xs text-slate-500">
                Notes: BANNED users cannot log in. SUSPENDED users cannot log in until the suspension expires.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
