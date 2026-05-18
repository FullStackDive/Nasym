"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Input } from "@/components/ui";
import { AdminShell } from "@/components/admin-client";

type Role = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
const ROLES: Role[] = ["ADMIN", "TEACHER", "STUDENT", "PARENT"];
type Status = "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "BANNED" | "REJECTED";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  status: Status;
  statusReason?: string | null;
  suspendedUntil?: string | null;
  createdAt: string;
};

function statusBadge(status: Status) {
  if (status === "ACTIVE") return <Badge className="bg-emerald-100 text-emerald-900">ACTIVE</Badge>;
  if (status === "PENDING_APPROVAL") return <Badge className="bg-amber-100 text-amber-900">PENDING</Badge>;
  if (status === "SUSPENDED") return <Badge className="bg-amber-100 text-amber-900">SUSPENDED</Badge>;
  if (status === "REJECTED") return <Badge className="bg-slate-100 text-slate-700">REJECTED</Badge>;
  return <Badge className="bg-red-100 text-red-900">BANNED</Badge>;
}

export default function AdminUsersClient() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Status modal state
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [status, setStatus] = useState<Status>("ACTIVE");
  const [reason, setReason] = useState("");
  const [until, setUntil] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(d?.error ?? "Failed to load users");
      return;
    }
    setItems(d.users ?? []);
    setErr(null);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function approve(u: UserRow) {
    if (!confirm(`Approve ${u.email}? They'll be emailed and can sign in.`)) return;
    setBusyId(u.id);
    setErr(null);
    const res = await fetch(`/api/admin/users/${u.id}/approve`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d?.error ?? "Approve failed");
      return;
    }
    void refresh();
  }

  async function changeRole(u: UserRow, role: Role) {
    if (role === u.role) return;
    if (!confirm(`Change ${u.email} role from ${u.role} to ${role}?`)) return;
    setBusyId(u.id);
    setErr(null);
    const res = await fetch(`/api/admin/users/${u.id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setBusyId(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d?.error ?? "Role change failed");
      return;
    }
    void refresh();
  }

  async function reject(u: UserRow) {
    const reason = prompt(`Reject ${u.email}? Optional reason:`);
    if (reason === null) return;
    setBusyId(u.id);
    setErr(null);
    const res = await fetch(`/api/admin/users/${u.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason || undefined }),
    });
    setBusyId(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d?.error ?? "Reject failed");
      return;
    }
    void refresh();
  }

  function pickForStatus(u: UserRow) {
    setSelected(u);
    setStatus(u.status === "PENDING_APPROVAL" || u.status === "REJECTED" ? "ACTIVE" : u.status);
    setReason(u.statusReason ?? "");
    if (u.suspendedUntil) {
      const dt = new Date(u.suspendedUntil);
      const pad = (n: number) => String(n).padStart(2, "0");
      setUntil(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`);
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

    let suspendedUntil: string | null = null;
    if (status === "SUSPENDED") {
      if (!until) { setSaving(false); setErr("For SUSPENDED, set 'Suspended until'."); return; }
      suspendedUntil = new Date(until).toISOString();
    }

    const res = await fetch(`/api/admin/users/${selected.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        reason: reason || null,
        suspendedUntil: status === "SUSPENDED" ? suspendedUntil : null,
      }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setErr(d?.error ?? "Update failed"); return; }
    clearPick();
    void refresh();
  }

  const pending = items.filter(u => u.status === "PENDING_APPROVAL");
  const others = items.filter(u => u.status !== "PENDING_APPROVAL");
  const q = filter.trim().toLowerCase();
  const filtered = !q ? others : others.filter(u =>
    u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q)
  );

  return (
    <AdminShell active="users">
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Users</h1>
          <p className="mt-2 text-slate-600">Approve registrations, manage status, set permissions.</p>
        </div>
      </div>

      {err && <Card className="mt-4 p-4 text-sm text-red-600">{err}</Card>}

      {/* Pending approval queue */}
      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold">Pending approval ({pending.length})</h2>
          {pending.length > 0 && <span className="text-xs text-slate-500">Approve or reject new registrations</span>}
        </div>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No pending registrations.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {pending.map(u => (
              <div key={u.id} className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-extrabold">{u.name || "—"}</p>
                    <p className="text-sm text-slate-600">{u.email}</p>
                    <p className="mt-1 text-xs text-slate-500">Registered: {new Date(u.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge>{u.role}</Badge>
                    <Button onClick={() => approve(u)} disabled={busyId === u.id}>
                      {busyId === u.id ? "…" : "Approve"}
                    </Button>
                    <Button variant="secondary" onClick={() => reject(u)} disabled={busyId === u.id}>
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* All users */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-extrabold">All users ({others.length})</h2>
            <div className="w-full sm:w-64">
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search by name/email" />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {filtered.map((u) => (
              <div
                key={u.id}
                className={`rounded-2xl border p-4 ${
                  selected?.id === u.id ? "border-brand-300 bg-brand-50" : "border-slate-100"
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

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button variant="secondary" onClick={() => pickForStatus(u)}>Manage status</Button>
                  <Link href={`/admin/users/${u.id}`}>
                    <Button variant="secondary">Permissions</Button>
                  </Link>
                  <label className="ml-auto inline-flex items-center gap-2 text-xs text-slate-500">
                    Role:
                    <select
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                      className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-sm text-slate-500">No users match.</p>}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-extrabold">Status</h2>
          <p className="mt-2 text-sm text-slate-600">Suspend, ban, or restore a user.</p>

          {!selected ? (
            <p className="mt-4 text-sm text-slate-600">Click <strong>Manage status</strong> on a user.</p>
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
                  onChange={(e) => setStatus(e.target.value as Status)}
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
                  <p className="mt-1 text-xs text-slate-500">User auto-reactivates after this time.</p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold">Reason (optional)</label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., spam, inappropriate content" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={saveStatus} disabled={saving} className="flex-1">
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button variant="secondary" onClick={clearPick}>Cancel</Button>
              </div>

              <p className="text-xs text-slate-500">
                BANNED users cannot log in. SUSPENDED users cannot log in until the time expires.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
    </AdminShell>
  );
}
